const Broker = require("workersbroker"),
    broker = Broker(),
    _global = require("./global");

const Handlers = {
    appState: {
        workers: []
    },
    pollEventLoop: function(){
        broker.notifyAll("getEventLoopInfo");
    },
    workerEL: function(workerInfo){
        broker.notifyAll({msg: "workerInfo", id: workerInfo.id, loop: workerInfo.el});
    }
};

module.exports=Handlers;