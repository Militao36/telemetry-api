"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
function errorHandler(err, req, res, next) {
    var _a, _b, _c;
    console.log(err);
    if ((_a = err === null || err === void 0 ? void 0 : err.message) === null || _a === void 0 ? void 0 : _a.includes('Cannot delete or update a parent row')) {
        res.status(400).json({
            message: 'Esse registro não pode ser deletado, favor deletar os items dele antes.'
        });
    }
    if (((_b = err === null || err === void 0 ? void 0 : err.message) === null || _b === void 0 ? void 0 : _b.includes('connect ECONNREFUSED 127.0.0.1:3306')) || (err === null || err === void 0 ? void 0 : err.sqlMessage)) {
        res.status(500).json({
            message: 'Server error'
        });
    }
    res.status(err.statusCode || 500).json({
        message: (_c = err === null || err === void 0 ? void 0 : err.message) !== null && _c !== void 0 ? _c : '',
        erros: (err === null || err === void 0 ? void 0 : err.erros) || {}
    });
}
