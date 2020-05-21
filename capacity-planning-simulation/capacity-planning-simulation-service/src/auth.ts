import { Response, Request, NextFunction } from "express";

export let headerAuth = (req: Request, res: Response, next: NextFunction) => {
    if (req.get('Authorization')) {
        return next();
    }
    else {
        console.log("auth failed");
        return res.sendStatus(401);
    }
};

