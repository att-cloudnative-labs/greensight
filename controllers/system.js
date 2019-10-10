const os = require("os"),
    cluster = require("cluster"),
    eloopmon = require("eventloopmon"),
    masterHandler = require("../ipc/masterhandlers"),
    Broker = require("workersbroker"),
    _global = require("../ipc/global"),
    broker = Broker();

/**
 * @name SystemRoute
 * @type Route
 * @description Default metrics service
 */
const SystemRoutes = {
    sysInfo: {
        cpuCount: os.cpus().length,
        cpus: os.cpus(),
        architecture: os.arch()
    },
    isCluster: function(){
        return typeof cluster.worker !== "undefined";  
    },
    readInfo: function(){
        broker.notifyMaster("pollEventLoop");
        this.sysInfo["mem.frees"] = os.freemem();
        this.sysInfo.uptime = process.uptime();
        this.sysInfo.heap = process.memoryUsage().heapTotal;
        this.sysInfo["heap.used"] = process.memoryUsage().heapUsed;
        return new Promise(function(resolve){
            eloopmon(function(t){
                SystemRoutes.sysInfo.eventloop = t;
                SystemRoutes.sysInfo.workers = _global.get();
                SystemRoutes.sysInfo.wid = SystemRoutes.isCluster() ? cluster.worker.id : 0;
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