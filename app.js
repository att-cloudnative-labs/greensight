const attmid = require("sdk-middleware-base"),
    bodyParser = require("body-parser"),
    compression = require("compression"),
    cookieParser = require("cookie-parser"),
    csurf = require("csurf"),
    express = require("express"),
    fs = require("fs"),
    helmet = require("helmet"),
    log = require("./lib/log"),
    responseTime = require("response-time"),
    slas = require("express-slas");

/**
 * Middleware configuration
 */
class App {
    getConfig() {
        const packInfo = JSON.parse(fs.readFileSync("package.json")),
            configFile = JSON.parse(fs.readFileSync("ansc.json")),
            config = {
              serviceName: packInfo.name,
              version: packInfo.version.split(".")[0] + "." + packInfo.version.split(".")[1],
              domain: configFile.servicedomain
            };
        return config;
    }
    
    constructor(app) {
        const basepath = `/`;
        app.use(express.static("public"));
        app.set("basepath", basepath);
        app.set( "x-powered-by", false);
        app.use( helmet() );
        app.use( slas({sla: 500}) );
        app.use( attmid() );
        app.use( responseTime() );
        app.use( compression({threshold: 1024}) );
        app.use( cookieParser() );
        app.use( csurf({cookie: true}) );
        app.use( bodyParser.json() );
        this.app = app;
    }
}

module.exports=App;