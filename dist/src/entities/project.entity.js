"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectEntity = void 0;
const Entity_1 = require("./base/Entity");
class ProjectEntity extends Entity_1.Entity {
    constructor(body, id) {
        super(body, id);
        this.idEmpresa = body.idEmpresa;
        this.name = body.name;
        this.description = body.description;
        this.enviroment = body.enviroment;
        this.languageOrFramework = body.languageOrFramework;
        this.token = body.token;
    }
}
exports.ProjectEntity = ProjectEntity;
