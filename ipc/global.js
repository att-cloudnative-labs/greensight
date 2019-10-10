global.ajsc = {};
global.ajsc.workers = {};
var g = {
    set: function(id, val){
        global.ajsc.workers[id] = val;
    },
    get: function(){
        return global.ajsc.workers;
    }
};

module.exports = g;
