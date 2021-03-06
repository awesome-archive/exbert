import * as tp from "./etc/types"
import * as x_ from "./etc/_Tools"
import * as _ from "lodash"
import * as R from 'ramda'
import { URLHandler } from "./etc/URLHandler";

const falsey = val => (new Set(['false', 0, "no", false, null, ""])).has(val)
const truthy = val => !falsey(val)
const toNumber = x => +x;


type InspectorOptions = "context" | "embeddings" | null

// Must be optional params for initializations
interface URLParameters {
    sentence?: string
    layer?: number
    heads?: number[]
    threshold?: number
    tokenInd?: number| 'null'
    tokenSide?: tp.SideOptions
    metaMatch?: tp.SimpleMeta | null
    metaMax?: tp.SimpleMeta | null
    displayInspector?: InspectorOptions
    offsetIdxs?: number[]
    maskInds?: number[]
    hideClsSep?: boolean
}

export class UIConfig {

    private _conf: URLParameters = {}
    private _headSet: Set<number>;
    attType: tp.SentenceOptions;
    nHeads: number;
    private _token: tp.TokenEvent;

    constructor(nHeads=12){
        this.nHeads = nHeads
        this.attType = 'aa'; // Don't allow this to be modified by the user.
        this.fromURL()
        this.toURL(false)
    }


    fromURL() {
        const params = URLHandler.parameters

        this._conf = {
            sentence: params['sentence'] || "The girl ran to a local pub to escape the din of her city.",
            layer: params['layer'] || 0,
            heads: this._initHeads(params['heads']),
            threshold: params['threshold'] || 0.7,
            tokenInd: params['tokenInd'] || null,
            tokenSide: params['tokenSide'] || null,
            maskInds: params['maskInds'] || [9],
            metaMatch: params['metaMatch'] || "pos",
            metaMax: params['metaMax'] || "pos",
            displayInspector: params['displayInspector'] || null,
            offsetIdxs: this._initOffsetIdxs(params['offsetIdxs']),
            hideClsSep: truthy(params['hideClsSep']) || true,
        }

        this._token = {side: this._conf.tokenSide, ind: this._conf.tokenInd}

    }

    toURL(updateHistory=false) {
        URLHandler.updateUrl(this._conf, updateHistory)
    }

    private _initOffsetIdxs(v:(string | number)[] | null) {
        if (v == null) {
            return [-1, 0, 1]
        }
        else {
            const numberArr = R.map(toNumber, v);
            return numberArr;
        }
    }

    private _initHeads(v:number[] | null) {
        if (v == null) {
            this.selectAllHeads()
        }
        else {
            this.headSet(new Set(v))._conf.heads;
        }

        return this.heads()
    }

    toggleSelectAllHeads() {
        if (this.heads().length == 0) {
            this.selectAllHeads()
        }
        else {
            this.selectNoHeads()
        }
    }

    selectAllHeads() {
        this.headSet(new Set(_.range(0, this.nHeads)))
    }

    selectNoHeads() {
        this.headSet(new Set([]))
    }

    toggleHead(head:number):tp.Toggled {
        let out;
        if (this.headSet().has(head)){
            this.headSet().delete(head);
            out = tp.Toggled.REMOVED
        }
        else {
            this.headSet().add(head);
            out = tp.Toggled.ADDED
        }

        // Set through setter function to ensure url is updated
        this.headSet(this.headSet()); // I hate mutable datastructures... This is confusing.

        return out
    }

    toggleToken(e:tp.TokenEvent):this {
        const picker = R.pick(['ind', 'side'])
        const compareEvent = picker(e)
        const compareToken = picker(this.token())

        if (R.equals(compareToken,compareEvent)) {
            console.log("REMOVING TOKEN");
            this.rmToken();
        }
        else {
            this.token(e);
        }
        return this;
    }

    token(): tp.TokenEvent;
    token(val:tp.TokenEvent): this;
    token(val?:tp.TokenEvent) {
        if (val == null)
            return this._token

        this._token = val;
        this._conf.tokenInd = val.ind;
        this._conf.tokenSide = val.side;
        this.toURL();

        return this
    }

    rmToken() {
        this.token({ind:null, side:null});
        return this
    }

    sentence(): string;
    sentence(val:string): this;
    sentence(val?) {
        if (val == null)
            return this._conf.sentence

        this._conf.sentence = val
        this.toURL(true)
        return this
    }

    threshold(): number;
    threshold(val: number): this;
    threshold(val?) {
        if (val == null) return this._conf.threshold;

        this._conf.threshold = val;
        this.toURL();
        return this;
    }

    heads(): number[] {
        return this._conf.heads
    }

    layer(): number
    layer(val: number): this
    layer(val?) {
        if (val == null)
            return this._conf.layer

        this._conf.layer = val;
        this.toURL();
        return this
    }

    headSet(): Set<number>;
    headSet(val: Set<number>): this;
    headSet(val?) {
        if (val == null) {
            return this._headSet;
        }

        this._headSet = val;
        this._conf.heads = x_.set2SortedArray(this._headSet)
        this.toURL();
        return this
    }

    metaMatch(): tp.SimpleMeta;
    metaMatch(val: tp.SimpleMeta): this;
    metaMatch(val?) {
        if (val == null) return this._conf.metaMax;

        this._conf.metaMax = val;
        this.toURL();
        return this;
    }

    metaMax(): tp.SimpleMeta;
    metaMax(val: tp.SimpleMeta): this;
    metaMax(val?) {
        if (val == null) return this._conf.metaMatch;

        this._conf.metaMatch = val;
        this.toURL();
        return this;
    }

    maskInds(): number[];
    maskInds(val: number[]): this;
    maskInds(val?) {
        if (val == null) return this._conf.maskInds;

        this._conf.maskInds = val;
        this.toURL();
        return this;
    }

    displayInspector(): InspectorOptions;
    displayInspector(val: InspectorOptions): this;
    displayInspector(val?) {
        if (val == null) return this._conf.displayInspector;

        this._conf.displayInspector = val;
        this.toURL();
        return this;
    }

    offsetIdxs(): number[];
    offsetIdxs(val: number[]): this;
    offsetIdxs(val?) {
        if (val == null) return this._conf.offsetIdxs;

        // convert to numbers

        this._conf.offsetIdxs = R.map(toNumber, val);
        this.toURL();
        return this;
    }

    hideClsSep(): boolean;
    hideClsSep(val: boolean): this;
    hideClsSep(val?) {
        if (val == null) return this._conf.hideClsSep;

        this._conf.hideClsSep = truthy(val);
        this.toURL();
        return this;
    }
}
