export let router = require('koa-router')();
const rp = require('request-promise-native');
const Promise = require('bluebird');
const _ = require('lodash');
const cradle = Promise.promisifyAll(require("cradle"));
const kue = require('kue');

const db = new (cradle.Connection)().database('apijson');
const responseDb = new (cradle.Connection)().database('responses');
const queue = kue.createQueue();

const Immutable = require('immutable');

function initDb(database) {
  database.exists(createDbIfNeeded);

  function createDbIfNeeded(err, exists) {
    if (err) {
      console.log('error', err);
    } else if (exists) {
      console.log('the force is with you.');
    } else {
      console.log('database does not exists.');
      database.create();
    /* populate design documents */
    }
  }
}

initDb(db);
initDb(responseDb);

let list = Immutable.List();

export function onIoConnect(io) {
  io.on('connection', function(socket) {
    socket.on('username', function(msg) {
      let username = msg.toLowerCase();
      socket.join(username);
      let index = list.indexOf(username);
      if (index > -1) {
        socket.emit("message", "queueposition " + (index + 1) + " " + list.size);
      }
    /*
    kue.Job.rangeByState('inactive', 0, -1, 'asc', function(err, jobs) {
      console.log(jobs);
    });
    kue.Job.rangeByState('active', 0, -1, 'asc', function(err, jobs) {
      console.log(jobs);
    });
    */
    });
  });

  queue.process("updateUser", (job, done) => {
    let username = job.data.title;
    updateUser(username)
      .then(() => {
        done();
        console.log("job done: " + username);
        io.to(username).emit("message", "done");
        list = list.delete(list.indexOf(username));
        list.forEach((username, index) => {
          io.to(username).emit("message", "queueposition " + (index + 1) + " " + list.size);
        })
      });
  })
}

async function updateUser(username) {
  console.log("processing: " + username);
  await getApiValue("animelist/" + username).then(async function(person) {
    let animeIdSet = Immutable.Set();
    var counter = {};
    var actors = {};
    await Promise.all(
      _(person.anime)
        .filter((anime) => {
          return anime.watched_status === "completed" || anime.watched_status === "watching";
        })
        .map(async(anime) => {
          animeIdSet = animeIdSet.add(anime.id);
          var addMe = anime.title + "\n";
          await getApiValue("anime/cast/" + anime.id).then((cast) => {
            addMe += "actors\n";
            _(cast.Characters)
              .filter({
                "role": "Main"
              })
              .map((character) => {
                return {
                  name: character.name,
                  actors: _(character.actors)
                    .filter({
                      language: "Japanese"
                    })
                    .map((actor) => {
                      if (!actors[actor.id]) {
                        actors[actor.id] = {
                          actor: actor,
                          animeScore: 0,
                          animeCount: 0,
                          character: [],
                        };
                      }
                      if (anime.score > 0) {
                        actors[actor.id].animeScore += anime.score;
                        actors[actor.id].animeCount++;
                      }
                      actors[actor.id].character.push(_(character).omit("actors").value());
                      let count = counter[actor.id];
                      if (count == null) {
                        counter[actor.id] = 1;
                      } else {
                        counter[actor.id] = ++count;
                      }
                      return actor;
                    })
                };
              })
              .each((character) => {
                addMe += JSON.stringify(character) + "\n"
              });
          }).catch(function(err) {
            console.log(err);
          // API call failed...
          });
        }));
    let sorted = _(counter)
      .pickBy((count, actorId) => {
        return _(actors[actorId].character).uniqBy("id").value().length > 1;
      })
      .toPairs()
      .sortBy([(pair) => {
        //TODO:Second sort by anime count, then by score
        return _(actors[pair[0]].character).uniqBy("id").value().length;
      }])
      .reverse()
      .value();

    let recommendationsMap = Immutable.Map();
    let maxCharactersPerActor = _(actors[sorted[0][0]].character).uniqBy("id").value().length;

    let response = await Promise.all(
      _(sorted)
        .map((value, rank) => {
          let actorInfo = actors[value[0]];
          let characters = _(actorInfo.character).uniqBy("id");
          return getApiValue("people/" + actors[value[0]].actor.id)
            .then((person) => {
              //Generate recommendations info
              if (rank < 10) {
              _(person.voice_acting_roles)
                .filter({main_role: true})
                .map((character) => ({
                  id: character.anime.id,
                  title: character.anime.title,
                  image: character.anime.image_url,
                }))
                .filter((anime) => !animeIdSet.includes(anime.id))
                .forEach((anime) => {
                  if (!recommendationsMap.has(anime.id)) {
                    recommendationsMap = recommendationsMap.set(anime.id, {...anime, actors: Immutable.Set()});
                  }
                  let animeInfo = recommendationsMap.get(anime.id);
                  recommendationsMap = recommendationsMap.set(anime.id, {...animeInfo, actors: animeInfo.actors.add(value[0])});
                });
              }

              return {
                actor: {
                  ..._(person).pick(["image_url", "name"]).value(),
                  id: actors[value[0]].actor.id
                },
                character: characters,
                count: value[1],
                average_score: actorInfo.animeCount > 0 ? (actorInfo.animeScore * 1.0 / actorInfo.animeCount).toFixed(2) : 0,
              }
            })
        })
    );

    //Post processing of recommendations info
    let recommendationsArray = recommendationsMap
      .filter((anime) => anime.actors.count() > 1)
      .map((anime, animeId) => ({
        animeId: anime.id,
        title: anime.title,
        image_url: anime.image,
        actors: anime.actors,
        //Arbitrary algorithm to generate a score for each anime based on VAs
        score: anime.actors.reduce((total, actorId) => total + _(actors[actorId].character).uniqBy("id").value().length, 0) + anime.actors.count() * 0.5 * maxCharactersPerActor,
      }))
      .toList()
      .sort((anime1, anime2) =>
        anime2.score - anime1.score
      )
      .toJS();

    if (username === "unichanchan")
      return;
    responseDb.save(username, {
      response: {
        voice_actors: response,
        recommendations: recommendationsArray,
      },
      last_updated: Date.now(),
    }, (err, res) => {
      console.log(res)
    });

  }).catch(function(err) {
    console.log(err);
  // API call failed...
  });
}

router.get('/mal/:id', async(ctx) => {
  let username = ctx.params.id.toLowerCase();
  if (!list.contains(username)) {
    console.log(username + " added to the queue");
    queue.create("updateUser", {
      title: username
    }).removeOnComplete(true).priority("high").save();
    list = list.push(username);
  }

  await getApiValue("profile/" + username)
    .then(async(profile) => {

      //If cached response
      await responseDb.getAsync(username)
        .then((doc) => {
          console.log("Returning cached response");
          ctx.body = {
            ...doc,
            profile: profile,
          };
        })
        .catch(async(err) => {
          //NEW USER

          ctx.body = {
            last_updated: "never",
            profile: profile,
          }
        });

    });
})

function getApiValue(apiPath) {
  //console.log(apiPath);
  return db.getAsync(apiPath).then((doc) => {
    //console.log("found");
    return doc;
  }).catch(async(err) => {
    //THIS FEELS REALLY BAD
    //TODO: add rate limit
    var options = {
      uri: 'http://localhost:9001/2.1/' + apiPath,
      json: true // Automatically parses the JSON string in the response
    };
    return await rp(options).then((jsonResponse) => {
        console.log("return from api");
        db.save(apiPath, jsonResponse, (err, res) => {
          console.log(res)
        });
        return jsonResponse;
      });
  });
}
