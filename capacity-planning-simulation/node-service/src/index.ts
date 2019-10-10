import * as express from 'express'
import { simulationRouter } from './simulation-router'

export class Server {

    public app: express.Application;

    public static bootstrap(): Server {
        return new Server();
    }

    constructor() {
        this.app = express();
        this.config();

        this.routes();
    }

    // this is just needed when running in local dev mode
    private allowCrossDomain(req: express.Request, res: express.Response, next: () => void) {
        res.header('Access-Control-Allow-Origin', 'http://localhost:4200');
        res.header('Access-Control-Allow-Headers', 'Authorization, Content-Type');
        res.header('Access-Control-Allow-Methods', 'GET,PUT,POST');
        res.header('Access-Control-Allow-Credentials', 'true');
        next();
    }

    public config() {
        this.app.use(this.allowCrossDomain);
    }

    public routes() {
        this.app.options('*', function(req, res) { res.sendStatus(200); });
        this.app.use('/v1/simulation', simulationRouter);
    }
}