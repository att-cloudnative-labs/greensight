const log4js = require("log4js"),
    level = (process.env === "dev") ? "debug" : "info",
    log = log4js.getLogger("service");
    
const c = {
  appenders: [
    {
      type: "console",
      layout: {
        type: "pattern",
        pattern: "[%r] [%[%5.5p%]] - %m%n"
      }
    }
  ]
};

log4js.configure( c );
    
log.setLevel( level );

module.exports = log;