"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserEntity = void 0;
const Entity_1 = require("./base/Entity");
class UserEntity extends Entity_1.Entity {
    constructor(body, id) {
        super(body, id);
        this.idEmpresa = body.idEmpresa;
        this.name = body.name;
        this.email = body.email;
        this.password = body.password;
    }
}
exports.UserEntity = UserEntity;
