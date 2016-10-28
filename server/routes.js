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
      socket.join(msg);
      let index = list.indexOf(msg);
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
    var counter = {};
    var actors = {};
    await Promise.all(person.anime.map(async(anime) => {
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
                      character: [_(character).omit("actors")]
                    };
                  } else {
                    actors[actor.id].character.push(_(character).omit("actors"));
                  }
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
    var sorted = _(counter)
      .pickBy((count) => {
        return count > 1;
      })
      .toPairs()
      .sortBy((pair) => {
        return pair[1];
      })
      .reverse()
      .forEach((value, key, map) => {
        //console.log(key + " " + value);
      })

    let response = await Promise.all(
      _(sorted)
        .slice(0, 5)
        .map((value) => {
          let characters = _(actors[value[0]].character).map((character) => character.value()).uniqBy("id");
          return getApiValue("people/" + actors[value[0]].actor.id)
            .then((person) => {
              return {
                actor: {
                  ..._(person).pick(["image_url", "name"]).value(),
                  id: actors[value[0]].actor.id
                },
                character: characters,
                count: value[1],
              }
            })
        })
    );

    console.log(username);
    if (username === "unichanchan" || username === "yongming")
      return;
    responseDb.save(username, {
      response: response,
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
  var options = {
    uri: 'http://localhost:9001/2.1/animelist/bryan792',
    json: true // Automatically parses the JSON string in the response 
  };

  let username = ctx.params.id;
      if (!list.contains(username)) {
        console.log(username + " added to the queue");
        queue.create("updateUser",
          {
            title: username
          }).removeOnComplete(true).priority("high").save();
        list = list.push(username);
      }

  //If cached response
  await responseDb.getAsync(username)
    .then((doc) => {
      console.log("Returning cached response");
      ctx.body = {...doc};
    })
    .catch((err) => {
      //NEW USER

      ctx.body = {
        last_updated: "never"
      }
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
