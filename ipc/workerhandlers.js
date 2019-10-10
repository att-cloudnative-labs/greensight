const Broker = require("workersbroker"),
    broker = Broker(),
    cluster = require("cluster"),
    g = require("./global"),
    eloopmon = require("eventloopmon");

const Handlers = {
    getEventLoopInfo: function(){
        const wid = (typeof cluster.worker !=="undefined") ? cluster.worker.id : 0;
        eloopmon(function(t){
            broker.notifyMaster({msg: "workerEL", id: wid, el: t});
        });
    },
    workerInfo: function(worker){
        g.set(worker.id, worker.loop);
    }
};

module.exports=Handlers;