const os = require("os"),
    cluster = require("cluster"),
    eloopmon = require("eventloopmon"),
    masterHandler = require("../ipc/masterhandlers"),
    Broker = require("workersbroker"),
    _global = require("../ipc/global"),
    fs = require("fs"),
    app = require("../app"),
    broker = Broker();

/**
 * @name SystemRoute
 * @type Route
 * @description Default metrics service
 */
const SystemRoutes = {
    sysInfo: {
	build: JSON.parse(fs.readFileSync("package.json"))
    },
    readInfo: function(){
        broker.notifyMaster("pollEventLoop");
        return new Promise(function(resolve){
            eloopmon(function(){       
                resolve(SystemRoutes.sysInfo);
            });
        });
    },
    /**
     * @description Returns system health
     */
    getInfo: function(req, res){
        SystemRoutes.readInfo().then( (sysInfo)=>res.send(sysInfo) );
    }
};

exports.status = SystemRoutes.getInfo;
