"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const cors_1 = __importDefault(require("cors"));
const openai_1 = require("@azure/openai");
dotenv_1.default.config();
const corsOptions = {
    origin: process.env.FRONTEND_URL,
    optionsSuccessStatus: 200,
};
const app = (0, express_1.default)();
app.use((0, cors_1.default)(corsOptions));
app.use(express_1.default.json());
const azureOpenaiKey = process.env.AZURE_OPENAI_KEY;
const model = process.env.AZURE_OPENAI_MODEL_ID;
const azureOpenaiEndpoint = process.env.AZURE_OPENAI_URL;
const searchEndpoint = process.env.AZURE_SEARCH_ENDPOINT;
const searchKey = process.env.AZURE_SEARCH_KEY;
const searchIndex = process.env.AZURE_SEARCH_INDEX;
const openaiClient = new openai_1.OpenAIClient(azureOpenaiEndpoint, new openai_1.AzureKeyCredential(azureOpenaiKey));
app.get("/", (_, response) => {
    response.sendFile(path_1.default.join(process.cwd(), "index.html"));
});
app.post("/chat", (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, e_1, _b, _c;
    try {
        const chunks = yield openaiClient.streamChatCompletions(model, request.body.messages, {
            azureExtensionOptions: {
                extensions: [
                    {
                        type: "AzureCognitiveSearch",
                        endpoint: searchEndpoint,
                        key: searchKey,
                        indexName: searchIndex,
                    },
                ],
            },
        });
        // Set response headers for streaming
        response.setHeader("Content-Type", "application/json");
        response.setHeader("Transfer-Encoding", "chunked");
        response.setHeader("Connection", "keep-alive");
        try {
            for (var _d = true, chunks_1 = __asyncValues(chunks), chunks_1_1; chunks_1_1 = yield chunks_1.next(), _a = chunks_1_1.done, !_a; _d = true) {
                _c = chunks_1_1.value;
                _d = false;
                const chunk = _c;
                response.write(JSON.stringify(chunk) + "\n");
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (!_d && !_a && (_b = chunks_1.return)) yield _b.call(chunks_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        response.end();
    }
    catch (error) {
        console.error("Error in chat endpoint:", error);
        response.status(500).json({ error: "Internal Server Error" });
    }
}));
app.listen(process.env.PORT, () => {
    console.log(`Listening on http://${process.env.HOST}:${process.env.PORT}`);
});
