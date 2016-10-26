const router = require('koa-router')();
const rp = require('request-promise-native');
const Promise = require('bluebird');
const _ = require('lodash');
const cradle = Promise.promisifyAll(require("cradle"));

const db = new (cradle.Connection)().database('apijson');
const responseDb = new (cradle.Connection)().database('responses');

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

router.get('/mal/:id', async(ctx) => {
  var options = {
    uri: 'http://localhost:9001/2.1/animelist/bryan792',
    json: true // Automatically parses the JSON string in the response 
  };

  let username = ctx.params.id;

  //If cached response
  await responseDb.getAsync(username)
    .then((doc) => {
      console.log("Returning cached response");
      ctx.body = doc.response;
    })
    .catch(async(err) => {
      await getApiValue("animelist/" + username).then(async function(person) {
        var counter = {};
        var actors = {};
        ctx.body = "";
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
          //ctx.body += addMe;
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
        responseDb.save(username, {response: response}, (err, res) => {
          console.log(res)
        });
        ctx.body = JSON.stringify(response);

      }).catch(function(err) {
        console.log(err);
      // API call failed... 
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

module.exports = router;
