const https = require('https');

let url = "https://www.wsj.com/election-results-2020-data/president.json";

var careAbout = [ "PA", "AZ", "NV", "NC", "GA" ];
var res = null;
var pollRateSeconds = 60;

function getUpdate() {
    https.get(url,(res) => {
        let body = "";

        res.on("data", (chunk) => {
            body += chunk;
        });

        res.on("end", () => {
            try {
                let json = JSON.parse(body);
                checkForChanges(json);
                setTimeout(getUpdate, pollRateSeconds * 1000);
            } catch (error) {
                console.error(error.message);
            };
        });

    }).on("error", (error) => {
        console.error(error.message);
    });
}

function checkForChanges(json) {
    if (res && res.created == json.meta.created)
        return;

    var first = res == null;
    careAbout.forEach(function (state) {
        var sData = json.data[state];
        if (res == null || res[state] == null) {
            console.log(state, "NEW");
        } else if (sData.tv != res[state].tv) {
            console.log(state, "UPDATE");
        } else {
            return;
        }

        if (first) {
            printState(sData, null);

            // Init first time through (messy because we are caching as a hash instead of an array)
            res = res || {};
            res[state] = {}
            res[state].tv = sData.tv;
            res[state].votes = {};
            sData.cand.forEach(function (candData) { res[state].votes[candData.name] = candData.votes });
        } else {
            // Cache will be updated when it prints
            printState(sData, res[state]);
        }
    });

    res.created = json.meta.created;
    console.log();
}

function printState(newData, oldData) {
    console.log("  Total Votes:", newData.tv, (oldData != null ? newData.tv - oldData.tv : ""));

    newData.cand.forEach(function (candData) {
        if (oldData != null) {
            console.log("  " + candData.name + ":", candData.votes, "+" + (candData.votes - oldData.votes[candData.name]));
            oldData.votes[candData.name] = candData.votes;
        } else {
            console.log("  " + candData.name + ":", candData.votes);
        }
    })
}

getUpdate();