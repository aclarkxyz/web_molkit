/// <reference path="../src/decl/jquery/index.d.ts" />
declare namespace WebMolKit {
    interface AspectTextRendering {
        name: string;
        descr: string;
        text: string;
        type: number;
    }
    interface AspectGraphicRendering {
        name: string;
        metavec: MetaVector;
    }
    abstract class Aspect {
        code: string;
        ds: DataSheet;
        protected allowModify: boolean;
        constructor(code: string, ds?: DataSheet, allowModify?: boolean);
        abstract plainHeading(): string;
        isColumnReserved(colName: string): boolean;
        areColumnsReserved(colNames: string[]): boolean[];
        rowFirstBlock(row: number): boolean;
        rowBlockCount(row: number): number;
        aspectUnion(other: Aspect): void;
        initiateNewRow(row: number): void;
        columnEffectivelyBlank(row: number): string[];
        static TEXT_PLAIN: number;
        static TEXT_LINK: number;
        static TEXT_HTML: number;
        numTextRenderings(row: number): number;
        produceTextRendering(row: number, idx: number): AspectTextRendering;
        numGraphicRenderings(row: number): number;
        produceGraphicRendering(row: number, idx: number, policy: RenderPolicy): AspectGraphicRendering;
        numHeaderRenderings(): number;
        produceHeaderRendering(idx: number): AspectTextRendering;
    }
}
declare namespace WebMolKit {
    function registerAspect(classdef: any): void;
    class AspectList {
        ds: DataSheet;
        constructor(ds: DataSheet);
        list(): [string[], string[]];
        instantiate(code: string): Aspect;
        enumerate(): Aspect[];
        aspectName(code: string): string;
    }
}
declare namespace WebMolKit {
    class AssayProvenanceHeader {
        prefixes: Record<string, string>;
        targetName: string;
        targetURI: string;
        organismName: string;
        organismURI: string;
        targetTypeName: string;
        targetTypeURI: string;
        cellName: string;
        cellURI: string;
        assayTypeName: string;
        assayTypeURI: string;
        assayDescription: string;
        sourceName: string;
        sourceURI: string;
        sourceVersion: string;
        documentName: string;
        documentURI: string;
        measureTypeName: string;
        measureTypeURI: string;
        unitNames: string[];
        unitURIs: string[];
    }
    class AssayProvenance extends Aspect {
        static CODE: string;
        static NAME: string;
        static COLNAME_MOLECULE: string;
        static COLNAME_NAME: string;
        static COLNAME_VALUE: string;
        static COLNAME_ERROR: string;
        static COLNAME_UNITS: string;
        static COLNAME_RELATION: string;
        static COLNAME_SOURCEURI: string;
        static URI_UNIT_M: string;
        static URI_UNIT_mM: string;
        static URI_UNIT_uM: string;
        static URI_UNIT_nM: string;
        static URI_UNIT_pM: string;
        static URI_UNIT_logM: string;
        static URI_UNIT_perM: string;
        static URI_UNIT_gL: string;
        static URI_UNIT_mgL: string;
        static URI_UNIT_ugL: string;
        static URI_UNIT_binary: string;
        static isAssayProvenance(ds: DataSheet): boolean;
        constructor(ds?: DataSheet, allowModify?: boolean);
        getHeader(): AssayProvenanceHeader;
        setHeader(header: AssayProvenanceHeader): void;
        getMolecule(row: number): Molecule;
        getName(row: number): string;
        getValue(row: number): number;
        getError(row: number): number;
        getUnits(row: number): string;
        getRelation(row: number): string;
        getSourceURI(row: number): string;
        setMolecule(row: number, v: Molecule): void;
        setName(row: number, v: string): void;
        setValue(row: number, v: number): void;
        setError(row: number, v: number): void;
        setUnits(row: number, v: string): void;
        setRelation(row: number, v: string): void;
        setSourceURI(row: number, v: string): void;
        private setup;
        private parseAndCorrect;
        private parseMetaData;
        private formatMetaData;
        plainHeading(): string;
        isColumnReserved(colName: string): boolean;
        numTextRenderings(row: number): number;
        produceTextRendering(row: number, idx: number): AspectTextRendering;
    }
}
declare namespace WebMolKit {
    class BayesianPredictionModel {
        colMolecule: string;
        colRaw: string;
        colScaled: string;
        colArcTan: string;
        colDomain: string;
        colAtoms: string;
        name: string;
        description: string;
        targetName: string;
        isOffTarget: boolean;
    }
    class BayesianPredictionOutcome {
        raw: number;
        scaled: number;
        arctan: number;
        domain: number;
        atoms: number[];
    }
    class BayesianPrediction extends Aspect {
        static CODE: string;
        static NAME: string;
        static isBayesianPrediction(ds: DataSheet): boolean;
        constructor(ds?: DataSheet, allowModify?: boolean);
        getModels(): BayesianPredictionModel[];
        setModels(models: BayesianPredictionModel[]): void;
        getOutcome(row: number, model: BayesianPredictionModel): BayesianPredictionOutcome;
        setOutcome(row: number, model: BayesianPredictionModel, outcome: BayesianPredictionOutcome): void;
        private setup;
        plainHeading(): string;
    }
}
declare namespace WebMolKit {
    class BayesianSourceModel {
        colNameMolecule: string;
        colNameValue: string;
        thresholdValue: number;
        thresholdRelation: string;
        folding: number;
        noteField: string;
        noteTitle: string;
        noteOrigin: string;
        noteComment: string;
    }
    class BayesianSource extends Aspect {
        static CODE: string;
        static NAME: string;
        static isBayesianSource(ds: DataSheet): boolean;
        constructor(ds?: DataSheet, allowModify?: boolean);
        getModels(): BayesianSourceModel[];
        setModels(models: BayesianSourceModel[]): void;
        private setup;
        plainHeading(): string;
    }
}
declare namespace WebMolKit {
    class BinaryDataField {
        colNameSource: string;
        colNameDest: string;
        thresholdValue: number;
        thresholdRelation: string;
    }
    class BinaryData extends Aspect {
        static CODE: string;
        static NAME: string;
        private fields;
        static isBinaryData(ds: DataSheet): boolean;
        constructor(ds?: DataSheet, allowModify?: boolean);
        getFields(): BinaryDataField[];
        setFields(fields: BinaryDataField[]): void;
        getValue(row: number, field: BinaryDataField): boolean;
        getSourceValue(row: number, field: BinaryDataField): boolean;
        getDestValue(row: number, field: BinaryDataField): boolean;
        private setup;
        private parseAndCorrect;
        private parseMetaData;
        private formatMetaData;
        plainHeading(): string;
        isColumnReserved(colName: string): boolean;
    }
}
declare namespace WebMolKit {
    enum ExperimentComponentType {
        Reactant = 0,
        Reagent = 1,
        Product = 2
    }
    class ExperimentComponent {
        mol: Molecule;
        name: string;
        stoich: string;
        mass: number;
        volume: number;
        moles: number;
        density: number;
        conc: number;
        yield: number;
        primary: boolean;
        waste: boolean;
        equiv: number;
        meta: string;
        constructor(mol?: Molecule, name?: string);
        clone(): ExperimentComponent;
        equals(other: ExperimentComponent): boolean;
        isBlank(): boolean;
    }
    class ExperimentStep {
        reactants: ExperimentComponent[];
        reagents: ExperimentComponent[];
        products: ExperimentComponent[];
        meta: string;
        constructor();
        clone(): ExperimentStep;
        equals(other: ExperimentStep): boolean;
    }
    class ExperimentEntry {
        title: string;
        createDate: Date;
        modifyDate: Date;
        doi: string;
        meta: string;
        steps: ExperimentStep[];
        constructor();
        clone(): ExperimentEntry;
        deepClone(): ExperimentEntry;
        equals(other: ExperimentEntry): boolean;
        getComponent(step: number, type: ExperimentComponentType, idx: number): ExperimentComponent;
    }
    class Experiment extends Aspect {
        static CODE: string;
        static CODE_RXN: string;
        static CODE_YLD: string;
        static NAME: string;
        static NAME_RXN: string;
        static NAME_YLD: string;
        static COLNAME_EXPERIMENT_TITLE: string;
        static COLNAME_EXPERIMENT_CREATEDATE: string;
        static COLNAME_EXPERIMENT_MODIFYDATE: string;
        static COLNAME_EXPERIMENT_DOI: string;
        static COLNAME_EXPERIMENT_META: string;
        static COLNAME_STEP_META: string;
        static COLNAME_REACTANT_MOL: string;
        static COLNAME_REACTANT_NAME: string;
        static COLNAME_REACTANT_STOICH: string;
        static COLNAME_REACTANT_MASS: string;
        static COLNAME_REACTANT_VOLUME: string;
        static COLNAME_REACTANT_MOLES: string;
        static COLNAME_REACTANT_DENSITY: string;
        static COLNAME_REACTANT_CONC: string;
        static COLNAME_REACTANT_PRIMARY: string;
        static COLNAME_REACTANT_META: string;
        static COLNAME_REAGENT_MOL: string;
        static COLNAME_REAGENT_NAME: string;
        static COLNAME_REAGENT_EQUIV: string;
        static COLNAME_REAGENT_MASS: string;
        static COLNAME_REAGENT_VOLUME: string;
        static COLNAME_REAGENT_MOLES: string;
        static COLNAME_REAGENT_DENSITY: string;
        static COLNAME_REAGENT_CONC: string;
        static COLNAME_REAGENT_META: string;
        static COLNAME_PRODUCT_MOL: string;
        static COLNAME_PRODUCT_NAME: string;
        static COLNAME_PRODUCT_STOICH: string;
        static COLNAME_PRODUCT_MASS: string;
        static COLNAME_PRODUCT_VOLUME: string;
        static COLNAME_PRODUCT_MOLES: string;
        static COLNAME_PRODUCT_DENSITY: string;
        static COLNAME_PRODUCT_CONC: string;
        static COLNAME_PRODUCT_YIELD: string;
        static COLNAME_PRODUCT_WASTE: string;
        static COLNAME_PRODUCT_META: string;
        static COLUMN_DESCRIPTIONS: Record<string, string>;
        static ALL_COLUMN_LITERALS: string[];
        static ALL_COLUMN_PREFIXES: string[];
        static isExperiment(ds: DataSheet): boolean;
        constructor(ds?: DataSheet, allowModify?: boolean);
        isFirstStep(row: number): boolean;
        numberOfSteps(row: number): number;
        getEntry(row: number): ExperimentEntry;
        setEntry(row: number, entry: ExperimentEntry): void;
        addEntry(entry: ExperimentEntry): void;
        insertEntry(row: number, entry: ExperimentEntry): void;
        deleteEntry(row: number): void;
        private setup;
        private parseAndCorrect;
        private forceColumn;
        private forceReactantColumns;
        private forceReagentColumns;
        private forceProductColumns;
        private parseReactionMetaData;
        private countComponents;
        private fetchReactant;
        private fetchProduct;
        private fetchReagent;
        private putEntry;
        plainHeading(): string;
        rowFirstBlock(row: number): boolean;
        rowBlockCount(row: number): number;
        initiateNewRow(row: number): void;
        columnEffectivelyBlank(row: number): string[];
        isColumnReserved(colName: string): boolean;
        areColumnsReserved(colNames: string[]): boolean[];
        numGraphicRenderings(row: number): number;
        produceGraphicRendering(row: number, idx: number, policy: RenderPolicy): AspectGraphicRendering;
    }
}
declare namespace WebMolKit {
    interface MeasurementDataUnit {
        name: string;
        uri: string;
    }
    interface MeasurementDataField {
        name: string;
        units: string[];
        defnURI: string[];
    }
    interface MeasurementDataHeader {
        units: MeasurementDataUnit[];
        fields: MeasurementDataField[];
    }
    interface MeasurementDataValue {
        value: number;
        error: number;
        units: string;
        mod: string;
    }
    class MeasurementData extends Aspect {
        static CODE: string;
        static NAME: string;
        static SUFFIX_VALUE: string;
        static SUFFIX_ERROR: string;
        static SUFFIX_UNITS: string;
        static SUFFIX_MOD: string;
        private header;
        static isMeasurementData(ds: DataSheet): boolean;
        constructor(ds?: DataSheet, allowModify?: boolean);
        getHeader(): MeasurementDataHeader;
        setHeader(header: MeasurementDataHeader): void;
        effectHeader(header: MeasurementDataHeader): void;
        rename(fldidx: number, newName: string): void;
        reservedColumns(fldidx: number): string[];
        getValue(row: number, fldidx: number): MeasurementDataValue;
        getValueField(row: number, field: MeasurementDataField): MeasurementDataValue;
        setValue(row: number, fldidx: number, value: MeasurementDataValue): void;
        clearValue(row: number, fldidx: number): void;
        getDescr(row: number, fldidx: number): string;
        setDescr(row: number, fldidx: number, descr: string): void;
        private setup;
        private parseAndCorrect;
        private ensureFields;
        private parseMetaData;
        private formatMetaData;
        plainHeading(): string;
        isColumnReserved(colName: string): boolean;
        areColumnsReserved(colNames: string[]): boolean[];
        numTextRenderings(row: number): number;
        produceTextRendering(row: number, idx: number): AspectTextRendering;
    }
}
declare namespace WebMolKit {
    enum MixtureAttributeType {
        Structure = "structure",
        Name = "name",
        Quantity = "quantity",
        Bound = "bound",
        Error = "error",
        Ratio = "ratio",
        Units = "units",
        Relation = "relation",
        Identifier = "identifier",
        Link = "link",
        Property = "property"
    }
    interface MixtureAttribute {
        column: string;
        position: number[];
        type: MixtureAttributeType;
        info?: string[];
    }
    interface MixtureHeader {
        attributes: MixtureAttribute[];
    }
    class Mixture extends Aspect {
        static CODE: string;
        static NAME: string;
        static SUFFIX_VALUE: string;
        private header;
        static isMixture(ds: DataSheet): boolean;
        constructor(ds?: DataSheet, allowModify?: boolean);
        getHeader(): MixtureHeader;
        setHeader(header: MixtureHeader): void;
        private setup;
        private parseAndCorrect;
        private parseMetaData;
        private formatMetaData;
        plainHeading(): string;
        isColumnReserved(colName: string): boolean;
        areColumnsReserved(colNames: string[]): boolean[];
    }
}
declare namespace WebMolKit {
    interface SARTableFields {
        construct: string;
        locked: string;
        scaffold: string;
        substituents: string[];
        metadata: string[];
    }
    interface SARTableEntry {
        construct: Molecule;
        locked: boolean;
        scaffold: Molecule;
        substNames: string[];
        substituents: Molecule[];
    }
    export class SARTable extends Aspect {
        static CODE: string;
        static NAME: string;
        private static DESCR_CONSTRUCT;
        private static DESCR_LOCKED;
        private static DESCR_SCAFFOLD;
        private static DESCR_SUBSTITUENT;
        static RENDER_CONSTRUCT: number;
        static RENDER_SCAFFOLD: number;
        static RENDER_SUBSTITUENT: number;
        static isSARTable(ds: DataSheet): boolean;
        constructor(ds?: DataSheet, allowModify?: boolean);
        getFields(): SARTableFields;
        setFields(fields: SARTableFields): void;
        getEntry(row: number): SARTableEntry;
        setEntry(row: number, entry: SARTableEntry): void;
        createSubstituents(tobeAdded: string[]): void;
        static isAttachment(mol: Molecule, atom: number): boolean;
        private setup;
        private parseAndCorrect;
        private parseMetaData;
        private formatMetaData;
        plainHeading(): string;
        isColumnReserved(colName: string): boolean;
        areColumnsReserved(colNames: string[]): boolean[];
        numGraphicRenderings(row: number): number;
        produceGraphicRendering(row: number, idx: number, policy: RenderPolicy): AspectGraphicRendering;
    }
    export {};
}
declare namespace WebMolKit {
    class BayesianModel {
        classType: number;
        folding?: number;
        private numActive;
        private inHash;
        private training;
        private activity;
        private contribs;
        private lowThresh;
        private highThresh;
        private range;
        private invRange;
        private estimates;
        rocX: number[];
        rocY: number[];
        rocType: string;
        rocAUC: number;
        trainingSize: number;
        trainingActives: number;
        atomicSlopeA: number;
        atomicInterceptB: number;
        truthTP: number;
        truthFP: number;
        truthTN: number;
        truthFN: number;
        precision: number;
        recall: number;
        specificity: number;
        statF1: number;
        statKappa: number;
        statMCC: number;
        noteTitle: string;
        noteOrigin: string;
        noteField: string;
        noteComments: string[];
        constructor(classType: number, folding?: number);
        addMolecule(mol: Molecule, active: boolean, hashes?: number[]): void;
        build(): void;
        predictMolecule(mol: Molecule): number;
        predictFP(hashes: number[]): number;
        scalePredictor(pred: number): number;
        scaleArcTan(scaled: number): number;
        calculateOverlap(mol: Molecule): number;
        calculateOverlapFP(hashes: number[]): number;
        calculateAtomPredictors(mol: Molecule): number[];
        validateLeaveOneOut(): void;
        validateFiveFold(): void;
        validateThreeFold(): void;
        clearTraining(): void;
        serialise(): string;
        static deserialise(str: string): BayesianModel;
        private singleLeaveOneOut;
        private validateNfold;
        private buildPartial;
        private estimatePartial;
        private calculateROC;
        private calculateTruth;
        private calibrateThresholds;
        determineCoverage(mol: Molecule, approvedHashes: Set<number>): {
            [id: number]: boolean[];
        };
    }
}
declare namespace WebMolKit {
    class BuildSMILES {
        private mol;
        private pri;
        private seq;
        private link;
        private conn;
        constructor(mol: Molecule, pri?: number[]);
        generate(): string;
        private walkSequence;
        private findLinks;
        private assemble;
    }
}
declare namespace WebMolKit {
    interface CircularFP {
        hashCode: number;
        iteration: number;
        atoms: number[];
        centralAtom: number;
    }
    class CircularFingerprints {
        private meta;
        private kind;
        static CLASS_ECFP0: number;
        static CLASS_ECFP2: number;
        static CLASS_ECFP4: number;
        static CLASS_ECFP6: number;
        hookApplyNewFP: (newFP: CircularFP) => void;
        hookConsiderNewFP: (newFP: CircularFP) => void;
        private identity;
        private resolvedChiral;
        private atomGroup;
        private fplist;
        private amask;
        private atomAdj;
        private bondAdj;
        constructor(meta: MetaMolecule, kind: number);
        calculate(): void;
        static create(meta: Molecule | MetaMolecule, kind: number): CircularFingerprints;
        getMolecule(): Molecule;
        get numFP(): number;
        getFP(idx: number): CircularFP;
        getFingerprints(): CircularFP[];
        getUniqueHashes(): number[];
        getFoldedHashes(maxBits: number): number[];
        static tanimoto(hash1: number[], hash2: number[]): number;
        private initialIdentityECFP;
        private circularIterate;
        private growAtoms;
        private applyNewFP;
        private considerNewFP;
    }
}
declare namespace WebMolKit {
    class ResonanceRemover {
        private mol;
        private resBonds;
        private atomHyd;
        maxIter: number;
        bondOrders: number[];
        tolerant: boolean;
        constructor(mol: Molecule, resBonds: boolean[], atomHyd?: number[]);
        perform(): void;
        private correctInputMask;
        private processComponent;
        private validPath;
    }
}
declare namespace WebMolKit {
    const TEMPLATE_FILES: string[];
    interface AbbrevContainerFrag {
        name: string;
        frag: Molecule;
        nameHTML: string;
        nameSearch: string;
    }
    class AbbrevContainer {
        static main: AbbrevContainer;
        private abbrevs;
        static needsSetup(): boolean;
        static setupData(): Promise<void>;
        getAbbrevs(): AbbrevContainerFrag[];
        submitAbbreviation(name: string, infrag: Molecule, promote?: boolean): void;
        submitMolecule(inmol: Molecule, promote?: boolean): void;
        substituteAbbrevName(mol: Molecule, atom: number): boolean;
        private submitFragment;
        private formatAbbrevLabel;
    }
}
declare namespace WebMolKit {
    const BONDARTIFACT_EXTRA_RESPATH = "xRESPATH:";
    const BONDARTIFACT_EXTRA_RESRING = "xRESRING:";
    const BONDARTIFACT_EXTRA_ARENE = "xARENE:";
    interface BondArtifactResPath {
        atoms: number[];
    }
    interface BondArtifactResRing {
        atoms: number[];
    }
    interface BondArtifactArene {
        centre: number;
        atoms: number[];
    }
    class BondArtifact {
        mol: Molecule;
        private resPaths;
        private resRings;
        private arenes;
        constructor(mol: Molecule);
        getPathBlocks(): number[];
        getRingBlocks(): number[];
        getAreneBlocks(): number[];
        getResPaths(): BondArtifactResPath[];
        getResRings(): BondArtifactResRing[];
        getArenes(): BondArtifactArene[];
        rewriteMolecule(): void;
        harmoniseNumbering(other: BondArtifact): void;
        createPath(atoms: number[]): boolean;
        createRing(atoms: number[]): boolean;
        createArene(atoms: number[]): boolean;
        removeArtifact(atoms: number[]): boolean;
        static removeAll(mol: Molecule): void;
        private appendResPath;
        private appendResRing;
        private appendArene;
        private pack;
        private pathify;
        private alreadyExists;
        private atomsAsPath;
        private atomsAsRing;
        private atomsAsArene;
        private nextIdentifier;
    }
}
declare namespace WebMolKit {
    class Chemistry {
        static ELEMENTS: string[];
        static ELEMENT_GROUPS: number[];
        static ELEMENT_ROWS: number[];
        static ELEMENT_BLOCKS: number[];
        static ELEMENT_VALENCE: number[];
        static ELEMENT_BONDING: number[];
        static ELEMENT_SHELL: number[];
        static NATURAL_ATOMIC_WEIGHTS: number[];
        static ELEMENT_H: number;
        static ELEMENT_He: number;
        static ELEMENT_Li: number;
        static ELEMENT_Be: number;
        static ELEMENT_B: number;
        static ELEMENT_C: number;
        static ELEMENT_N: number;
        static ELEMENT_O: number;
        static ELEMENT_F: number;
        static ELEMENT_Ne: number;
        static ELEMENT_Na: number;
        static ELEMENT_Mg: number;
        static ELEMENT_Al: number;
        static ELEMENT_Si: number;
        static ELEMENT_P: number;
        static ELEMENT_S: number;
        static ELEMENT_Cl: number;
        static ELEMENT_Ar: number;
        static ELEMENT_K: number;
        static ELEMENT_Ca: number;
        static ELEMENT_Sc: number;
        static ELEMENT_Ti: number;
        static ELEMENT_V: number;
        static ELEMENT_Cr: number;
        static ELEMENT_Mn: number;
        static ELEMENT_Fe: number;
        static ELEMENT_Co: number;
        static ELEMENT_Ni: number;
        static ELEMENT_Cu: number;
        static ELEMENT_Zn: number;
        static ELEMENT_Ga: number;
        static ELEMENT_Ge: number;
        static ELEMENT_As: number;
        static ELEMENT_Se: number;
        static ELEMENT_Br: number;
        static ELEMENT_Kr: number;
        static ELEMENT_Rb: number;
        static ELEMENT_Sr: number;
        static ELEMENT_Y: number;
        static ELEMENT_Zr: number;
        static ELEMENT_Nb: number;
        static ELEMENT_Mo: number;
        static ELEMENT_Tc: number;
        static ELEMENT_Ru: number;
        static ELEMENT_Rh: number;
        static ELEMENT_Pd: number;
        static ELEMENT_Ag: number;
        static ELEMENT_Cd: number;
        static ELEMENT_In: number;
        static ELEMENT_Sn: number;
        static ELEMENT_Sb: number;
        static ELEMENT_Te: number;
        static ELEMENT_I: number;
        static ELEMENT_Xe: number;
        static ELEMENT_Cs: number;
        static ELEMENT_Ba: number;
        static ELEMENT_La: number;
        static ELEMENT_Ce: number;
        static ELEMENT_Pr: number;
        static ELEMENT_Nd: number;
        static ELEMENT_Pm: number;
        static ELEMENT_Sm: number;
        static ELEMENT_Eu: number;
        static ELEMENT_Gd: number;
        static ELEMENT_Tb: number;
        static ELEMENT_Dy: number;
        static ELEMENT_Ho: number;
        static ELEMENT_Er: number;
        static ELEMENT_Tm: number;
        static ELEMENT_Yb: number;
        static ELEMENT_Lu: number;
        static ELEMENT_Hf: number;
        static ELEMENT_Ta: number;
        static ELEMENT_W: number;
        static ELEMENT_Re: number;
        static ELEMENT_Os: number;
        static ELEMENT_Ir: number;
        static ELEMENT_Pt: number;
        static ELEMENT_Au: number;
        static ELEMENT_Hg: number;
        static ELEMENT_Tl: number;
        static ELEMENT_Pb: number;
        static ELEMENT_Bi: number;
        static ELEMENT_Po: number;
        static ELEMENT_At: number;
        static ELEMENT_Rn: number;
        static ELEMENT_Fr: number;
        static ELEMENT_Ra: number;
        static ELEMENT_Ac: number;
        static ELEMENT_Th: number;
        static ELEMENT_Pa: number;
        static ELEMENT_U: number;
        static ELEMENT_Np: number;
        static ELEMENT_Pu: number;
        static ELEMENT_Am: number;
        static ELEMENT_Cm: number;
        static ELEMENT_Bk: number;
        static ELEMENT_Cf: number;
        static ELEMENT_Es: number;
        static ELEMENT_Fm: number;
        static ELEMENT_Md: number;
        static ELEMENT_No: number;
        static ELEMENT_Lr: number;
        static ELEMENT_Rf: number;
        static ELEMENT_Db: number;
        static ELEMENT_Sg: number;
        static ELEMENT_Bh: number;
        static ELEMENT_Hs: number;
        static ELEMENT_Mt: number;
        static ELEMENT_Ds: number;
        static ELEMENT_Rg: number;
        static ELEMENT_Cn: number;
    }
}
declare namespace WebMolKit {
    class CoordUtil {
        static OVERLAP_THRESHOLD: number;
        static OVERLAP_THRESHOLD_SQ: number;
        static atomAtPoint(mol: Molecule, x: number, y: number, tolerance?: number): number;
        private static DEFAULT_EQUIV_TOLERANCE;
        static sketchEquivalent(mol1: Molecule, mol2: Molecule, tolerance?: number): boolean;
        static sketchMappable(mol1: Molecule, mol2: Molecule, tolerance?: number): boolean;
        static atomBondAngles(mol: Molecule, atom: number, adj?: number[]): number[];
        static overlapsAtom(mol: Molecule, x: number, y: number, tol: number): boolean;
        static overlappingAtomMask(mol: Molecule, thresh?: number): boolean[];
        static overlappingAtomList(mol: Molecule, thresh?: number): number[];
        static congestionPoint(mol: Molecule, x: number, y: number, approach?: number): number;
        static congestionMolecule(mol: Molecule, approach?: number): number;
        static translateMolecule(mol: Molecule, ox: number, oy: number): void;
        static rotateMolecule(mol: Molecule, theta: number, cx?: number, cy?: number): void;
        static rotateBond(mol: Molecule, centre: number, atom: number, theta: number): void;
        static rotateAtoms(mol: Molecule, mask: boolean[], cx: number, cy: number, theta: number): void;
        static angleNeighbours(mol: Molecule, atom: number): number[];
        static mergeAtoms(mol: Molecule, oldN: number, newN: number): void;
        static normaliseBondDistances(mol: Molecule): void;
        static mirrorImage(mol: Molecule): Molecule;
        static alignOrientFlip(mol1: Molecule, idx1: number[], mol2: Molecule, idx2: number[]): void;
        static atomIsWeirdLinear(mol: Molecule, idx: number): boolean;
    }
}
declare namespace WebMolKit {
    const enum DataSheetColumn {
        Molecule = "molecule",
        String = "string",
        Real = "real",
        Integer = "integer",
        Boolean = "boolean",
        Extend = "extend"
    }
    class DataSheet {
        private data;
        constructor(data?: any);
        clone(withRows?: boolean): DataSheet;
        cloneMask(colMask: boolean[], rowMask?: boolean[], inclExtn?: boolean): DataSheet;
        getData(): any;
        get numCols(): number;
        get numRows(): number;
        get title(): string;
        set title(title: string);
        get description(): string;
        set description(description: string);
        get numExtensions(): number;
        getExtName(idx: number): string;
        getExtType(idx: number): string;
        getExtData(idx: number): string;
        setExtName(idx: number, val: string): void;
        setExtType(idx: number, val: string): void;
        setExtData(idx: number, val: string): void;
        appendExtension(name: string, type: string, data: string): number;
        insertExtension(idx: number, name: string, type: string, data: string): void;
        deleteExtension(idx: number): void;
        colName(col: number): string;
        colType(col: number): DataSheetColumn;
        colDescr(col: number): string;
        isNull(row: number, col: number | string): boolean;
        notNull(row: number, col: number | string): boolean;
        isBlank(row: number, col: number | string): boolean;
        notBlank(row: number, col: number | string): boolean;
        getObject(row: number, col: number | string): any;
        getMolecule(row: number, col: number | string): Molecule;
        getMoleculeClone(row: number, col: number | string): Molecule;
        getMoleculeBlank(row: number, col: number | string): Molecule;
        getString(row: number, col: number | string): string;
        getInteger(row: number, col: number | string): number;
        getReal(row: number, col: number | string): number;
        getBoolean(row: number, col: number | string): boolean;
        getExtend(row: number, col: number | string): string;
        setToNull(row: number, col: number | string): void;
        setObject(row: number, col: number | string, val: any): void;
        setMolecule(row: number, col: number | string, mol: Molecule): void;
        setString(row: number, col: number | string, val: string): void;
        setInteger(row: number, col: number | string, val: number): void;
        setReal(row: number, col: number | string, val: number): void;
        setBoolean(row: number, col: number | string, val: boolean): void;
        setExtend(row: number, col: number | string, val: string): void;
        isEqualMolecule(row: number, col: number | string, mol: Molecule): boolean;
        isEqualString(row: number, col: number | string, val: string): boolean;
        isEqualInteger(row: number, col: number | string, val: number): boolean;
        isEqualReal(row: number, col: number | string, val: number): boolean;
        isEqualBoolean(row: number, col: number | string, val: boolean): boolean;
        appendColumn(name: string, type: DataSheetColumn, descr: string): number;
        insertColumn(col: number, name: string, type: DataSheetColumn, descr: string): void;
        deleteColumn(col: number): void;
        changeColumnName(col: number, name: string, descr: string): void;
        changeColumnType(col: number, newType: DataSheetColumn): void;
        ensureColumn(name: string, type: DataSheetColumn, descr: string): number;
        reorderColumns(order: number[]): void;
        appendRow(): number;
        appendRowFrom(srcDS: DataSheet, row: number): number;
        insertRow(row: number): void;
        deleteRow(row: number): void;
        deleteAllRows(): void;
        moveRowUp(row: number): void;
        moveRowDown(row: number): void;
        swapRows(row1: number, row2: number): void;
        exciseSingleRow(row: number): DataSheet;
        colIsPrimitive(col: number | string): boolean;
        findColByName(name: string, type?: string): number;
        firstColOfType(type: string): number;
        copyCell(toRow: number, toCol: number, fromDS: DataSheet, fromRow: number, fromCol: number): void;
        static convertType(obj: any, fromType: DataSheetColumn, toType: DataSheetColumn): any;
        toString(row: number, col: number | string): string;
        toInt(row: number, col: number): number;
        toReal(row: number, col: number): number;
    }
}
declare namespace WebMolKit {
    class DataSheetStream {
        static readXML(strXML: string): DataSheet;
        static readJSON(json: any): DataSheet;
        static writeXML(ds: DataSheet): string;
        static writeJSON(ds: DataSheet): any;
    }
}
declare namespace WebMolKit {
    interface DotPathBlock {
        atoms: number[];
        bonds: number[];
        numer: number;
        denom: number;
    }
    const enum DotPathBond {
        O0 = 0,
        O01 = 1,
        O1 = 2,
        O12 = 3,
        O2 = 4,
        O23 = 5,
        O3 = 6,
        O3X = 7
    }
    const enum DotPathCharge {
        N1X = -3,
        N1 = -2,
        N01 = -1,
        Z0 = 0,
        P01 = 1,
        P1 = 2,
        P1X = 3
    }
    class DotPath {
        mol: Molecule;
        maskBlock: boolean[];
        paths: DotPathBlock[];
        constructor(mol: Molecule);
        clone(): DotPath;
        getBondOrders(): number[];
        getBondClasses(): DotPathBond[];
        getChargeClasses(): DotPathCharge[];
        getAggregateCharges(): number[];
        toString(): string;
        private calculate;
    }
}
declare namespace WebMolKit {
    enum ExperimentMetaType {
        Role = "role",
        Pressure = "pressure",
        TurnoverNumber = "turnover_number",
        EnantiomericExcess = "enantiomeric_excess",
        Time = "time",
        Heat = "heat",
        Light = "light"
    }
    enum ExperimentMetaApplic {
        Experiment = 0,
        Step = 1,
        Reactant = 2,
        Reagent = 3,
        Product = 4
    }
    enum ExperimentMetaValue {
        Boolean = 0,
        Number = 1,
        Optional = 2,
        String = 3
    }
    enum ExperimentMetaRoleType {
        Reagent = "reagent",
        Catalyst = "catalyst",
        Solvent = "solvent"
    }
    class ExperimentMeta {
        static APPLICABILITY: {
            role: ExperimentMetaApplic[];
            pressure: ExperimentMetaApplic[];
            turnover_number: ExperimentMetaApplic[];
            enantiomeric_excess: ExperimentMetaApplic[];
            time: ExperimentMetaApplic[];
            heat: ExperimentMetaApplic[];
            light: ExperimentMetaApplic[];
        };
        static NAMES: {
            role: string;
            pressure: string;
            turnover_number: string;
            enantiomeric_excess: string;
            time: string;
            heat: string;
            light: string;
        };
        static UNITS: {
            pressure: string;
            turnover_number: string;
            enantiomeric_excess: string;
            time: string;
            heat: string;
            light: string;
        };
        static VALUES: {
            role: ExperimentMetaValue;
            pressure: ExperimentMetaValue;
            turnover_number: ExperimentMetaValue;
            enantiomeric_excess: ExperimentMetaValue;
            time: ExperimentMetaValue;
            heat: ExperimentMetaValue;
            light: ExperimentMetaValue;
        };
        static unpackMeta(str: string): [ExperimentMetaType, number | string][];
        static packMeta(list: [ExperimentMetaType, number | string][]): string;
        static withMetaKey(metastr: string, type: ExperimentMetaType, value: string): string;
        static describeMeta(type: ExperimentMetaType, value: number | string): string;
    }
}
declare namespace WebMolKit {
    enum ForeignMoleculeExtra {
        AtomAromatic = "yAROMATIC",
        BondAromatic = "yAROMATIC",
        AtomChiralMDLOdd = "yCHIRAL_MDL_ODD",
        AtomChiralMDLEven = "yCHIRAL_MDL_EVEN",
        AtomChiralMDLRacemic = "yCHIRAL_MDL_RACEMIC",
        AtomExplicitValence = "yMDL_EXPLICIT_VALENCE"
    }
    class ForeignMolecule {
        static noteAromaticAtoms(mol: Molecule): boolean[];
        static noteAromaticBonds(mol: Molecule): boolean[];
        static markExplicitValence(mol: Molecule, atom: number, valence: number): void;
        static noteExplicitValence(mol: Molecule, atom: number): number;
    }
}
declare namespace WebMolKit {
    class FormatList {
        static FMT_NATIVE: string;
        static FMT_XMLDS: string;
        static FMT_MDLMOL: string;
        static FMT_MDLSDF: string;
        static FMT_MDLRDF: string;
        static FMT_MDLRXN: string;
        static GFX_PNG: string;
        static GFX_PNGZIP: string;
        static GFX_SVG: string;
        static GFX_SVGZIP: string;
        static GFX_PDF: string;
        static GFX_PDFZIP: string;
        static GFX_EPS: string;
        static GFX_HTML: string;
        static GFX_OPENDOC_ODG: string;
        static GFX_OPENDOC_ODT: string;
        static GFX_OPENDOC_ODS: string;
        static GFX_OOXML_DOCX: string;
        static GFX_OOXML_XLSX: string;
        static FORMAT_DESCR: Record<string, string>;
        static FORMAT_EXTN: Record<string, string>;
        static FORMAT_MIMETYPE: Record<string, string>;
    }
}
declare namespace WebMolKit {
    class Graph {
        private nbrs;
        private indices;
        private labels;
        private props;
        constructor(sz?: number, edge1?: number[], edge2?: number[]);
        clone(): Graph;
        static fromMolecule(mol: Molecule): Graph;
        static fromNeighbours(nbrs: number[][]): Graph;
        toString(): string;
        get numNodes(): number;
        numEdges(node: number): number;
        getEdge(node: number, edge: number): number;
        getEdges(node: number): number[];
        getIndex(node: number): number;
        setIndex(node: number, idx: number): void;
        getLabel(node: number): string;
        setLabel(node: number, lbl: string): void;
        getProperty(node: number): any;
        setProperty(node: number, prp: any): void;
        addNode(): number;
        hasEdge(node1: number, node2: number): boolean;
        addEdge(node1: number, node2: number): void;
        removeEdge(node1: number, node2: number): void;
        isolateNode(node: number): void;
        keepNodesMask(mask: boolean[]): void;
        keepNodesIndex(idx: number[]): void;
        removeNodesMask(mask: boolean[]): void;
        removeNodesIndex(idx: number[]): void;
        subgraphIndex(idx: number[]): Graph;
        subgraphMask(mask: boolean[]): Graph;
        calculateComponents(): number[];
        calculateComponentGroups(): number[][];
        calculateRingBlocks(): [number[], number];
        calculateRingBlockGroups(): number[][];
        findRingsOfSize(size: number): number[][];
        findRingsOfSizeMask(size: number, mask: boolean[]): number[][];
        calculateBFS(idx: number): number[];
        calculateGravity(): number[];
        private recursiveRingFind;
    }
}
declare namespace WebMolKit {
    const MDLMOL_VALENCE: Record<string, number[]>;
    interface MDLReaderLinkNode {
        atom: number;
        nbrs: number[];
        minRep: number;
        maxRep: number;
    }
    interface MDLReaderGroupMixture {
        index: number;
        parent: number;
        type: string;
        atoms: number[];
    }
    interface MDLReaderSuperAtom {
        atoms: number[];
        name: string;
        bracketType?: string;
        connectType?: string;
        bonds?: number[];
        bondConn?: number[];
    }
    class MDLMOLReader {
        parseHeader: boolean;
        parseExtended: boolean;
        allowV3000: boolean;
        considerRescale: boolean;
        keepAromatic: boolean;
        keepParity: boolean;
        keepQuery: boolean;
        mol: Molecule;
        molName: string;
        overallStereoAbsolute: boolean;
        atomHyd: number[];
        resBonds: boolean[];
        groupAttachAny: Map<number, number[]>;
        groupAttachAll: Map<number, number[]>;
        groupStereoAbsolute: number[];
        groupStereoRacemic: number[][];
        groupStereoRelative: number[][];
        groupLinkNodes: MDLReaderLinkNode[];
        groupMixtures: MDLReaderGroupMixture[];
        private pos;
        private lines;
        constructor(strData: string);
        parse(): Molecule;
        private nextLine;
        private parseCTAB;
        private postFix;
        private parseV3000;
        private applySuperAtom;
        private applyPolymerBlock;
        private withoutQuotes;
        private splitWithQuotes;
        private unpackList;
    }
    class MDLSDFReader {
        ds: DataSheet;
        upcastColumns: boolean;
        private pos;
        private lines;
        constructor(strData: string);
        parse(): DataSheet;
        private parseStream;
        private upcastStringColumns;
    }
}
declare namespace WebMolKit {
    class MDLMOLWriter {
        mol: Molecule;
        includeHeader: boolean;
        overallStereoAbsolute: boolean;
        enhancedFields: boolean;
        chargeSeparate: boolean;
        abbrevSgroups: boolean;
        polymerBlocks: boolean;
        molName: string;
        private sgroupNames;
        private sgroupAtoms;
        private lines;
        constructor(mol: Molecule);
        write(): string;
        writeV3000(): string;
        writeEither(): string;
        getResult(): string;
        private writeCTAB;
        private writeMBlockPair;
        private writeMBlockFlat;
        private writeMBlockFlatIdxFirst;
        private intrpad;
        private rpad;
        private mdlValence;
        private partialAbbrevExpansion;
        private prepareSgroups;
        private encodePolymerBlocks;
        writeCTAB3000(): void;
        private packV3000List;
    }
    class MDLSDFWriter {
        ds: DataSheet;
        enhancedFields: boolean;
        chargeSeparate: boolean;
        abbrevSgroups: boolean;
        private lines;
        constructor(ds: DataSheet);
        write(): string;
        getResult(): string;
    }
}
declare namespace WebMolKit {
    class MetaMolecule {
        mol: Molecule;
        static skeletonHash: (mol: Molecule) => string;
        static isomorphMatch: (meta1: MetaMolecule, meta2: MetaMolecule, timeout: number) => boolean;
        atomArom: boolean[];
        bondArom: boolean[];
        rubricTetra: number[][];
        rubricSquare: number[][];
        rubricBipy: number[][];
        rubricOcta: number[][];
        rubricSides: number[][];
        hash: string;
        heavyHash: string;
        uniqueElements: string[];
        dots: DotPath;
        private piAtom;
        constructor(mol: Molecule);
        calculateStrictAromaticity(): void;
        calculateRelaxedAromaticity(): void;
        calculateStereoRubric(): void;
        removeHydrogens(): void;
        calculateSkeletonHash(): void;
        calculateHeavyHash(): void;
        isAtomAromatic(atom: number): boolean;
        isBondAromatic(bond: number): boolean;
        bondOrderArom(bond: number): number;
        getAtomAromaticity(): boolean[];
        getBondAromaticity(): boolean[];
        getSkeletonHash(): string;
        getHeavyHash(): string;
        getDotPath(): DotPath;
        getUniqueElements(): string[];
        equivalentTo(other: MetaMolecule, timeout?: number): boolean;
        static createRubric(mol: Molecule): MetaMolecule;
        static createStrict(mol: Molecule): MetaMolecule;
        static createStrictRubric(mol: Molecule): MetaMolecule;
        static createRelaxed(mol: Molecule): MetaMolecule;
        static createRelaxedRubric(mol: Molecule): MetaMolecule;
        private ensurePiAtoms;
    }
}
declare namespace WebMolKit {
    class MolUtil {
        static isBlank(mol: Molecule): boolean;
        static notBlank(mol: Molecule): boolean;
        static orBlank(mol: Molecule): Molecule;
        static TEMPLATE_ATTACHMENT: string;
        static ABBREV_ATTACHMENT: string;
        static hasAnyAbbrev(mol: Molecule): boolean;
        static hasAbbrev(mol: Molecule, atom: number): boolean;
        static getAbbrev(mol: Molecule, atom: number): Molecule;
        static setAbbrev(mol: Molecule, atom: number, frag: Molecule): void;
        static validateAbbrevs(mol: Molecule): void;
        static convertToAbbrev(mol: Molecule, srcmask: boolean[], abbrevName: string): Molecule;
        static convertToAbbrevIndex(mol: Molecule, srcmask: boolean[], abbrevName: string): [Molecule, number];
        static expandAbbrevs(mol: Molecule, alignCoords: boolean): void;
        static expandedAbbrevs(mol: Molecule): Molecule;
        static expandOneAbbrev(mol: Molecule, atom: number, alignCoords: boolean): boolean[];
        static expandOneAbbrevFrag(mol: Molecule, atom: number, frag: Molecule, alignCoords: boolean): boolean[];
        static clearAbbrev(mol: Molecule, atom: number): void;
        static setAtomElement(mol: Molecule, atom: number, el: string): void;
        static addBond(mol: Molecule, bfr: number, bto: number, order: number, type?: number): number;
        static subgraphMask(mol: Molecule, mask: boolean[]): Molecule;
        static subgraphIndex(mol: Molecule, idx: number[]): Molecule;
        static subgraphWithAttachments(mol: Molecule, mask: boolean[]): Molecule;
        static append(mol: Molecule, frag: Molecule): void;
        static deleteAtoms(mol: Molecule, idx: number[]): Molecule;
        static componentList(mol: Molecule): number[][];
        static getAtomSides(mol: Molecule, atom: number): number[][];
        static getBondSides(mol: Molecule, bond: number): number[][];
        static arrayAtomX(mol: Molecule): number[];
        static arrayAtomY(mol: Molecule): number[];
        static arrayAtomMapNum(mol: Molecule): number[];
        static molecularFormula(mol: Molecule, punctuation?: boolean | string[]): string;
        static molecularWeight(mol: Molecule): number;
        static removeDuplicateBonds(mol: Molecule): void;
        static calculateWalkWeight(mol: Molecule, atom: number): number[];
        static totalHydrogens(mol: Molecule, atom: number): number;
        static stripHydrogens(mol: Molecule, force?: boolean): void;
        static boringHydrogen(mol: Molecule, atom: number): boolean;
        static createHydrogens(mol: Molecule, position?: boolean): number;
        static atomVec3(mol: Molecule, atom: number): number[];
        static atomOxidationState(mol: Molecule, atom: number): number;
        static oxidationStateText(oxstate: number): string;
    }
}
declare namespace WebMolKit {
    class Atom {
        element: string;
        x: number;
        y: number;
        z: number;
        charge: number;
        unpaired: number;
        isotope: number;
        hExplicit: number;
        mapNum: number;
        extra: string[];
        transient: string[];
    }
    class Bond {
        from: number;
        to: number;
        order: number;
        type: number;
        extra: string[];
        transient: string[];
    }
    export class Molecule {
        private atoms;
        private bonds;
        private hasZCoord;
        keepTransient: boolean;
        private hasTransient;
        private graph;
        private graphBond;
        private ringID;
        private compID;
        private ring3;
        private ring4;
        private ring5;
        private ring6;
        private ring7;
        static IDEALBOND: number;
        static HEXPLICIT_UNKNOWN: number;
        static ISOTOPE_NATURAL: number;
        static BONDTYPE_NORMAL: number;
        static BONDTYPE_INCLINED: number;
        static BONDTYPE_DECLINED: number;
        static BONDTYPE_UNKNOWN: number;
        static HYVALENCE_EL: string[];
        static HYVALENCE_VAL: number[];
        static PREFIX_EXTRA: string;
        static PREFIX_TRANSIENT: string;
        constructor();
        clone(): Molecule;
        static fromString(strData: string): Molecule;
        toString(): string;
        append(frag: Molecule): void;
        get numAtoms(): number;
        getAtom(idx: number): Atom;
        atomElement(idx: number): string;
        atomX(idx: number): number;
        atomY(idx: number): number;
        atomCharge(idx: number): number;
        atomUnpaired(idx: number): number;
        atomIsotope(idx: number): number;
        atomHExplicit(idx: number): number;
        atomMapNum(idx: number): number;
        atomExtra(idx: number): string[];
        atomTransient(idx: number): string[];
        get numBonds(): number;
        getBond(idx: number): Bond;
        bondFrom(idx: number): number;
        bondTo(idx: number): number;
        bondOrder(idx: number): number;
        bondType(idx: number): number;
        bondExtra(idx: number): string[];
        bondTransient(idx: number): string[];
        bondFromTo(idx: number): number[];
        addAtom(element: string, x: number, y: number, charge?: number, unpaired?: number): number;
        setAtomElement(idx: number, element: string): void;
        setAtomPos(idx: number, x: number, y: number, z?: number): void;
        setAtomX(idx: number, x: number): void;
        setAtomY(idx: number, y: number): void;
        setAtomCharge(idx: number, charge: number): void;
        setAtomUnpaired(idx: number, unpaired: number): void;
        setAtomIsotope(idx: number, isotope: number): void;
        setAtomHExplicit(idx: number, hExplicit: number): void;
        setAtomMapNum(idx: number, mapNum: number): void;
        setAtomExtra(idx: number, extra: string[]): void;
        setAtomTransient(idx: number, transi: string[]): void;
        swapAtoms(a1: number, a2: number): void;
        addBond(from: number, to: number, order: number, type?: number): number;
        setBondFrom(idx: number, bfr: number): void;
        setBondTo(idx: number, to: number): void;
        setBondFromTo(idx: number, bfr: number, bto: number): void;
        setBondOrder(idx: number, order: number): void;
        setBondType(idx: number, type: number): void;
        setBondExtra(idx: number, extra: string[]): void;
        setBondTransient(idx: number, transi: string[]): void;
        deleteAtomAndBonds(idx: number): void;
        deleteBond(idx: number): void;
        atomHydrogens(idx: number): number;
        findBond(a1: number, a2: number): number;
        bondOther(idx: number, ref: number): number;
        atomExplicit(idx: number): boolean;
        atomRingBlock(idx: number): number;
        bondInRing(idx: number): boolean;
        atomConnComp(idx: number): number;
        atomAdjCount(idx: number): number;
        atomAdjList(idx: number): number[];
        atomAdjBonds(idx: number): number[];
        findRingsOfSize(size: number): number[][];
        boundary(): Box;
        atomicNumber(idx: number): number;
        static elementAtomicNumber(element: string): number;
        is3D(): boolean;
        setIs3D(v: boolean): void;
        atomZ(idx: number): number;
        setAtomZ(idx: number, z: number): void;
        compareTo(other: Molecule): number;
        private trashGraph;
        private trashTransient;
        private buildGraph;
        private buildConnComp;
        private buildRingID;
        private recursiveRingFind;
    }
    export {};
}
declare namespace WebMolKit {
    class MoleculeStream {
        static readUnknown(strData: string): Molecule;
        static readNative(strData: string): Molecule;
        static writeNative(mol: Molecule): string;
        static readMDLMOL(strData: string): Molecule;
        static writeMDLMOL(mol: Molecule): string;
        static skUnescape(str: string): string;
        static skEscape(str: string): string;
        static skEncodeExtra(extra: string[]): string;
    }
}
declare namespace WebMolKit {
    interface OntologyTreeTerm {
        uri: string;
        label: string;
        parent: OntologyTreeTerm;
        children: OntologyTreeTerm[];
        depth: number;
    }
    class OntologyTree {
        static get main(): OntologyTree;
        private roots;
        private mapTerms;
        private alreadyLoaded;
        constructor();
        static init(): Promise<void>;
        getRoots(): OntologyTreeTerm[];
        hasTerm(uri: string): boolean;
        getBranch(uri: string): OntologyTreeTerm[];
        getBranchList(root: string | OntologyTreeTerm): OntologyTreeTerm[];
        loadFromURL(url: string): Promise<void>;
        loadContent(text: string): void;
        debugString(term: OntologyTreeTerm): string;
    }
}
declare namespace WebMolKit {
    const POLYMERBLOCK_EXTRA_POLYMER = "xPOLYMER:";
    const POLYMERBLOCK_SPECIAL_UNCAPPED = "*";
    enum PolymerBlockConnectivity {
        HeadToTail = "ht",
        HeadToHead = "hh",
        Random = "rnd"
    }
    class PolymerBlockUnit {
        atoms: number[];
        connect: PolymerBlockConnectivity;
        bondConn: number[];
        atomName: Map<number, number[]>;
        bondIncl: Map<number, number[]>;
        bondExcl: Map<number, number[]>;
        constructor(atoms: number[]);
        clone(): PolymerBlockUnit;
    }
    class PolymerBlock {
        mol: Molecule;
        private units;
        constructor(mol: Molecule);
        getIDList(): number[];
        getUnit(id: number): PolymerBlockUnit;
        getUnits(): PolymerBlockUnit[];
        rewriteMolecule(): void;
        harmoniseNumbering(other: PolymerBlock): void;
        removeUnit(id: number): void;
        removeAll(): void;
        createUnit(unit: PolymerBlockUnit): number;
        static hasPolymerExtensions(mol: Molecule): boolean;
        static getPolymerExtensions(mol: Molecule, atom: number): string[];
        static removePolymerExtensions(mol: Molecule, atom: number): void;
        private appendBlock;
        private formatBlockAtom;
        private formatBlockBond;
        private purgeExtraFields;
        private writeUnit;
        private nextIdentifier;
    }
}
declare namespace WebMolKit {
    const enum QuantityCalcRole {
        Primary = 1,
        Secondary = 2,
        Product = 3,
        Independent = 4
    }
    const enum QuantityCalcStat {
        Unknown = 0,
        Actual = 1,
        Virtual = 2,
        Conflict = 3
    }
    class QuantityCalcComp {
        comp: ExperimentComponent;
        step: number;
        type: ExperimentComponentType;
        idx: number;
        role: number;
        molw: number;
        valueEquiv: number;
        statEquiv: QuantityCalcStat;
        valueMass: number;
        statMass: QuantityCalcStat;
        valueVolume: number;
        statVolume: QuantityCalcStat;
        valueMoles: number;
        statMoles: QuantityCalcStat;
        valueDensity: number;
        statDensity: QuantityCalcStat;
        valueConc: number;
        statConc: QuantityCalcStat;
        valueYield: number;
        statYield: QuantityCalcStat;
        constructor(comp: ExperimentComponent, step: number, type: ExperimentComponentType, idx: number);
    }
    class GreenMetrics {
        step: number;
        idx: number;
        massReact: number[];
        massProd: number[];
        massWaste: number[];
        massProdWaste: number[];
        molwReact: number[];
        molwProd: number[];
        impliedWaste: number;
        isBlank: boolean;
    }
    class QuantityCalc {
        entry: ExperimentEntry;
        static UNSPECIFIED: number;
        quantities: QuantityCalcComp[];
        primaryMoles: number[];
        idxPrimary: number[];
        idxYield: number[];
        allMassReact: number[];
        allMassProd: number[];
        allMassWaste: number[];
        greenMetrics: GreenMetrics[];
        static isStoichZero(stoich: string): boolean;
        static isStoichUnity(stoich: string): boolean;
        static extractStoichFraction(stoich: string): [number, number];
        static extractStoichValue(stoich: string): number;
        private static MAX_DENOM;
        private static RATIO_FRACT;
        static stoichAsRatio(stoich: string): [number, number];
        static stoichFractAsRatio(fract: number): [number, number];
        static impliedReagentStoich(reagent: ExperimentComponent, products: ExperimentComponent[]): number;
        static componentRatio(entry: ExperimentEntry, step: number): [number[], number[], number[]];
        constructor(entry: ExperimentEntry);
        calculate(): void;
        get numQuantities(): number;
        getQuantity(idx: number): QuantityCalcComp;
        getAllQuantities(): QuantityCalcComp[];
        get numGreenMetrics(): number;
        getGreenMetrics(idx: number): GreenMetrics;
        getAllGreenMetrics(): GreenMetrics[];
        getAllMassReact(): number[];
        getAllMassProd(): number[];
        getAllMassWaste(): number[];
        findComponent(step: number, type: number, idx: number): QuantityCalcComp;
        static formatMolWeight(value: number): string;
        static formatMass(value: number): string;
        static formatVolume(value: number): string;
        static formatMoles(value: number): string;
        static formatDensity(value: number): string;
        static formatConc(value: number): string;
        static formatPercent(value: number): string;
        static formatEquiv(value: number): string;
        private classifyTypes;
        private calculateSomething;
        private calculateGreenMetrics;
        private closeEnough;
    }
}
declare namespace WebMolKit {
    function safeInt(str: string, def?: number): number;
    function safeFloat(str: string, def?: number): number;
    function newElement(parent: any, tag: string, attr?: Record<string, any>): Element;
    function addText(parent: any, text: string): void;
    function plural(count: number): string;
    function formatDouble(value: number, sigfig: number): string;
    function htmlToRGB(col: string): number;
    function colourCode(col: number): string;
    function colourAlpha(col: number): number;
    function colourCanvas(col: number): string;
    function blendRGB(fract: number, rgb1: number, rgb2: number, rgb3?: number): number;
    function formatDate(date: Date): string;
    function nodeText(node: Node): string;
    function isDef(v: any): boolean;
    function notDef(v: any): boolean;
    function eventCoords(event: MouseEvent | Touch | JQueryMouseEventObject, container: any): number[];
    function setBoundaryPixels(dom: JQuery | DOM, x: number, y: number, w: number, h: number): void;
    function getBoundaryPixels(dom: JQuery): [number, number, number, number];
    function getBoundaryPixelsDOM(dom: DOM): [number, number, number, number];
    function getOffsetPixelsDOM(dom: DOM): [number, number, number, number];
    function norm_xy(dx: number, dy: number): number;
    function norm_xyz(dx: number, dy: number, dz: number): number;
    function norm2_xy(dx: number, dy: number): number;
    function norm2_xyz(dx: number, dy: number, dz: number): number;
    function signum(v: number): number;
    function sqr(v: number): number;
    function invZ(v: number): number;
    function fltEqual(v1: number, v2: number): boolean;
    function realEqual(v1: number, v2: number): boolean;
    function randomInt(size: number): number;
    const TWOPI: number;
    const INV_TWOPI: number;
    const DEGRAD: number;
    const RADDEG: number;
    function angleNorm(th: number): number;
    function angleDiff(th1: number, th2: number): number;
    function angleDiffPos(th1: number, th2: number): number;
    function sortAngles(theta: number[]): number[];
    function uniqueAngles(theta: number[], threshold: number): number[];
    function minArray(a: number[]): number;
    function maxArray(a: number[]): number;
    function findNode(parent: Node, name: string): Element;
    function findNodes(parent: Node, name: string): Element[];
    function pathRoundedRect(x1: number, y1: number, x2: number, y2: number, rad: number): Path2D;
    function drawLine(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number): void;
    const ASCENT_FUDGE = 1.4;
    function fontSansSerif(ascent: number): string;
    function pixelDensity(): number;
    function clone<T>(data: T): T;
    function deepClone<T>(data: T): T;
    function escapeHTML(text: string): string;
    function orBlank(str: string): string;
    function dictValues<T>(dict: {
        [id: string]: T;
    }): T[];
    function zip<U, V>(u: U[], v: V[]): [U, V][];
    function toUTF8(str: string): string;
    function fromUTF8(str: string): string;
    function jsonPrettyPrint(json: any): string;
    const enum KeyCode {
        Backspace = "Backspace",
        Tab = "Tab",
        Enter = "Enter",
        Escape = "Escape",
        Space = " ",
        PageUp = "PageUp",
        PageDown = "PageDown",
        End = "End",
        Home = "Home",
        Left = "ArrowLeft",
        Right = "ArrowRight",
        Up = "ArrowUp",
        Down = "ArrowDown",
        Delete = "Delete",
        Insert = "Insert"
    }
    function readTextURL(url: string | URL): Promise<string>;
    function postJSONURL(url: string | URL, params: Record<string, any>): Promise<Record<string, any>>;
    function yieldDOM(): Promise<void>;
    function pause(seconds: number): Promise<void>;
    function empiricalScrollerSize(): Size;
}
declare namespace WebMolKit {
    enum QueryTypeAtom {
        Charges = "qC:",
        Aromatic = "qA:",
        Elements = "qE:",
        ElementsNot = "qE!",
        RingSizes = "qR:",
        RingSizesNot = "qR!",
        RingBlock = "qB:",
        NumRings = "qN:",
        Adjacency = "qJ:",
        BondSums = "qO:",
        Valences = "qV:",
        Hydrogens = "qH:",
        Isotopes = "qI:",
        SubFrags = "qX:",
        SubFragsNot = "qX!"
    }
    enum QueryTypeBond {
        RingSizes = "qR:",
        RingSizesNot = "qR!",
        RingBlock = "qB:",
        NumRings = "qN:",
        Orders = "qO:"
    }
    class QueryUtil {
        static hasAnyQueryAtom(mol: Molecule, atom: number): boolean;
        static hasAnyQueryBond(mol: Molecule, bond: number): boolean;
        static hasQueryAtom(mol: Molecule, atom: number, type: QueryTypeAtom): boolean;
        static hasQueryBond(mol: Molecule, bond: number, type: QueryTypeBond): boolean;
        static deleteQueryAtom(mol: Molecule, atom: number, type: QueryTypeAtom): void;
        static deleteQueryBond(mol: Molecule, bond: number, type: QueryTypeBond): void;
        static deleteQueryAtomAll(mol: Molecule, atom: number): void;
        static deleteQueryBondAll(mol: Molecule, bond: number): void;
        static queryAtomString(mol: Molecule, atom: number, type: QueryTypeAtom): string;
        static queryAtomStringList(mol: Molecule, atom: number, type: QueryTypeAtom): string[];
        static queryBondString(mol: Molecule, bond: number, type: QueryTypeBond): string;
        static setQueryAtom(mol: Molecule, atom: number, type: QueryTypeAtom, str: string): void;
        static setQueryAtomList(mol: Molecule, atom: number, type: QueryTypeAtom, list: string[]): void;
        static setQueryBond(mol: Molecule, bond: number, type: QueryTypeBond, str: string): void;
        static queryAtomCharges(mol: Molecule, atom: number): number[];
        static queryAtomAromatic(mol: Molecule, atom: number): boolean;
        static queryAtomElements(mol: Molecule, atom: number): string[];
        static queryAtomElementsNot(mol: Molecule, atom: number): string[];
        static queryAtomRingSizes(mol: Molecule, atom: number): number[];
        static queryAtomRingSizesNot(mol: Molecule, atom: number): number[];
        static queryAtomRingBlock(mol: Molecule, atom: number): boolean;
        static queryAtomNumRings(mol: Molecule, atom: number): number[];
        static queryAtomAdjacency(mol: Molecule, atom: number): number[];
        static queryAtomBondSums(mol: Molecule, atom: number): number[];
        static queryAtomValences(mol: Molecule, atom: number): number[];
        static queryAtomHydrogens(mol: Molecule, atom: number): number[];
        static queryAtomIsotope(mol: Molecule, atom: number): number[];
        static queryAtomSubFrags(mol: Molecule, atom: number): Molecule[];
        static queryAtomSubFragsNot(mol: Molecule, atom: number): Molecule[];
        static queryBondRingSizes(mol: Molecule, bond: number): number[];
        static queryBondRingSizesNot(mol: Molecule, bond: number): number[];
        static queryBondRingBlock(mol: Molecule, bond: number): boolean;
        static queryBondNumRings(mol: Molecule, bond: number): number[];
        static queryBondOrders(mol: Molecule, bond: number): number[];
        static setQueryAtomCharges(mol: Molecule, atom: number, value: number[]): void;
        static setQueryAtomAromatic(mol: Molecule, atom: number, value: boolean): void;
        static setQueryAtomElements(mol: Molecule, atom: number, value: string[]): void;
        static setQueryAtomElementsNot(mol: Molecule, atom: number, value: string[]): void;
        static setQueryAtomRingSizes(mol: Molecule, atom: number, value: number[]): void;
        static setQueryAtomRingSizesNot(mol: Molecule, atom: number, value: number[]): void;
        static setQueryAtomRingBlock(mol: Molecule, atom: number, value: boolean): void;
        static setQueryAtomNumRings(mol: Molecule, atom: number, value: number[]): void;
        static setQueryAtomAdjacency(mol: Molecule, atom: number, value: number[]): void;
        static setQueryAtomBondSums(mol: Molecule, atom: number, value: number[]): void;
        static setQueryAtomValences(mol: Molecule, atom: number, value: number[]): void;
        static setQueryAtomHydrogens(mol: Molecule, atom: number, value: number[]): void;
        static setQueryAtomIsotope(mol: Molecule, atom: number, value: number[]): void;
        static setQueryAtomSubFrags(mol: Molecule, atom: number, value: Molecule[]): void;
        static setQueryAtomSubFragsNot(mol: Molecule, atom: number, value: Molecule[]): void;
        static setQueryBondRingSizes(mol: Molecule, bond: number, value: number[]): void;
        static setQueryBondRingSizesNot(mol: Molecule, bond: number, value: number[]): void;
        static setQueryBondRingBlock(mol: Molecule, bond: number, value: boolean): void;
        static setQueryBondNumRings(mol: Molecule, bond: number, value: number[]): void;
        static setQueryBondOrders(mol: Molecule, bond: number, value: number[]): void;
        private static parseIntegers;
        private static parseStrings;
        private static parseBoolean;
        static parseMolecules(list: string[]): Molecule[];
        private static formatIntegers;
        private static formatStrings;
        private static formatBoolean;
        private static formatMolecules;
    }
}
declare namespace WebMolKit {
    interface GuidelineSprout {
        atom: number;
        orders: number[];
        x: number[];
        y: number[];
        sourceX?: number;
        sourceY?: number;
        destX?: number[];
        destY?: number[];
    }
    enum Geometry {
        Linear = 0,
        Bent = 1,
        Trigonal = 2,
        Tetra1 = 3,
        Tetra2 = 4,
        SqPlan = 5,
        BasePyram = 6,
        TrigBip = 7,
        Octa1 = 8,
        Octa2 = 9
    }
    class SketchUtil {
        static GEOM_ANGLES: number[][];
        static placeNewAtom(mol: Molecule, el: string): number;
        static placeNewFragment(mol: Molecule, frag: Molecule): void;
        private static fragPosScore;
        static mergeOverlappingAtoms(mol: Molecule): number[];
        static mergeFragmentsDiv(mol: Molecule, div: number): number[];
        static mergeFragmentsMask(mol: Molecule, mask: boolean[]): void;
        static matchAngleGeometry(geom: number, theta: number[]): boolean;
        static primeDirections(mol: Molecule, atom: number): number[];
        static exitVectors(mol: Molecule, atom: number): number[];
        static calculateNewBondAngles(mol: Molecule, atom: number, order: number): number[];
        static guessAtomGeometry(mol: Molecule, atom: number, order: number): number[];
        static mapAngleSubstituent(geom: number, ang: number[]): number[];
        static refitAtomGeometry(mol: Molecule, atom: number, geom: number): Molecule;
        static switchAtomGeometry(mol: Molecule, src: number, dst: number[], geoms: number[]): Molecule;
        static pickAtomsToConnect(mol: Molecule, aidx: number[]): number[];
        static pickNewAtomDirection(mol: Molecule, atom: number, theta: number[]): number;
        static joinOverlappingAtoms(mol: Molecule, mask: boolean[]): Molecule;
        static moveToEdge(mol: Molecule, mask: boolean[], dx: number, dy: number): Molecule;
        static placeAdditionalHydrogens(mol: Molecule, atom: number, numH: number): void;
        static allViableDirections(mol: Molecule, atom: number, order: number): number[];
        static proposeNewRing(mol: Molecule, rsz: number, x: number, y: number, dx: number, dy: number, snap: boolean): [number[], number[]];
        static proposeAtomRing(mol: Molecule, rsz: number, atom: number, dx: number, dy: number): [number[], number[]];
        static proposeBondRing(mol: Molecule, rsz: number, bond: number, dx: number, dy: number): [number[], number[]];
        static positionSimpleRing(mol: Molecule, rsz: number, x: number, y: number, theta: number): [number[], number[]];
        static guidelineSprouts(mol: Molecule, atom: number): GuidelineSprout[];
    }
}
declare namespace WebMolKit {
    const STEREOGROUP_EXTRA_RACEMIC = "xCHIRAC:";
    const STEREOGROUP_EXTRA_RELATIVE = "xCHIREL:";
    class StereoGroup {
        private mol;
        private chiRac;
        private chiRel;
        static hasStereoGroups(mol: Molecule): boolean;
        constructor(mol: Molecule);
        getRacemicGroups(): number[];
        getRelativeGroups(): number[];
        getRacemicAtoms(): number[][];
        getRelativeAtoms(): number[][];
        getRacemicGroupAtoms(grp: number): number[];
        getRelativeGroupAtoms(grp: number): number[];
        rewriteMolecule(): void;
        harmoniseNumbering(other: StereoGroup): void;
        createRacemic(atoms: number[]): number;
        createRelative(atoms: number[]): number;
        removeRacemic(grp: number): void;
        removeRelative(grp: number): void;
        static removeAll(mol: Molecule): void;
        private atomHasWedge;
        private nextIdentifier;
    }
}
declare namespace WebMolKit {
    class Stereochemistry {
        meta: MetaMolecule;
        private mol;
        private priority;
        private chiralTetra;
        private cistransBond;
        private squarePlanar;
        private isH;
        static STEREO_NONE: number;
        static STEREO_POS: number;
        static STEREO_NEG: number;
        static STEREO_UNKNOWN: number;
        static STEREO_BROKEN: number;
        static RUBRIC_EQUIV_TETRA: number[][];
        static RUBRIC_EQUIV_SIDES: number[][];
        static RUBRIC_EQUIV_SQUARE: number[][];
        static RUBRIC_EQUIV_BIPY: number[][];
        static RUBRIC_EQUIV_OCTA: number[][];
        constructor(meta: MetaMolecule);
        calculate(): void;
        atomPriority(atom: number): number;
        atomTetraChirality(atom: number): number;
        bondSideStereo(bond: number): number;
        atomPlanarStereo(atom: number): number;
        getPriorities(): number[];
        getAtomTetraChiral(): number[];
        getBondSideStereo(): number[];
        static create(meta: MetaMolecule): Stereochemistry;
        static rubricTetrahedral(mol: Molecule, atom: number): number[];
        static rubricSquarePlanar(mol: Molecule, atom: number): number[];
        static rubricBipyrimidal(mol: Molecule, atom: number): number[];
        static rubricOctahedral(mol: Molecule, atom: number): number[];
        static rubricBondSides(mol: Molecule, bond: number): number[];
        private buildTetraChirality;
        private buildBondCisTrans;
        private buildPlanarCisTrans;
        private buildOctaChirality;
        private buildPriority;
        private sortAndGroup;
    }
}
declare namespace WebMolKit {
    class Dialog {
        private parent;
        minPortionWidth: number;
        maxPortionWidth: number;
        maximumWidth: number;
        maximumHeight: number;
        minPortionHeight: number;
        maxPortionHeight: number;
        topMargin: number;
        title: string;
        allowScroller: boolean;
        protected domObscureBackground: DOM;
        protected domObscureForeground: DOM;
        protected domPanelBoundary: DOM;
        protected domTitle: DOM;
        protected domTitleButtons: DOM;
        protected domBody: DOM;
        protected domClose: DOM;
        protected get obscureBackground(): JQuery;
        protected get obscureForeground(): JQuery;
        protected get panelBoundary(): JQuery;
        protected get titleDiv(): JQuery;
        protected get titleButtons(): JQuery;
        protected get bodyDiv(): JQuery;
        protected get btnClose(): JQuery;
        callbackClose: (source?: Dialog) => void;
        callbackShown: (source?: Dialog) => void;
        constructor(parent?: any);
        onClose(callback: (source?: Dialog) => void): void;
        onShown(callback: (source?: Dialog) => void): void;
        open(): void;
        close(): void;
        bump(): void;
        body(): JQuery;
        buttons(): JQuery;
        bodyDOM(): DOM;
        buttonsDOM(): DOM;
        protected populate(): void;
        private repositionSize;
    }
}
declare namespace WebMolKit {
    class EditCompound extends Dialog {
        private mol;
        protected btnClear: DOM;
        protected btnCopy: DOM;
        protected btnSave: DOM;
        protected sketcher: Sketcher;
        private proxyClip;
        private proxyMenu;
        private callbackSave;
        constructor(mol: Molecule, parent?: any);
        onSave(callback: (source?: EditCompound) => void): void;
        getMolecule(): Molecule;
        getSketcher(): Sketcher;
        defineClipboard(proxy: ClipboardProxy): void;
        defineContext(proxy: MenuProxy): void;
        close(): void;
        protected populate(): void;
        actionCopy(): void;
        actionCut(): void;
        actionPaste(): void;
        actionUndo(): void;
        actionRedo(): void;
    }
}
declare namespace WebMolKit {
    class MapReaction extends Dialog {
        private btnClear;
        private btnSave;
        callbackSave: (source?: MapReaction) => void;
        private mol1;
        private mol2;
        private policy;
        private layout1;
        private layout2;
        private box1;
        private box2;
        private boxArrow;
        private padding;
        private scale;
        private offsetX1;
        private offsetY1;
        private offsetX2;
        private offsetY2;
        private canvasW;
        private canvasH;
        private canvas;
        private drawnMols;
        private highlighted;
        private pressed;
        private dragToX;
        private dragToY;
        constructor(mol1: Molecule, mol2: Molecule);
        getMolecule1(): Molecule;
        getMolecule2(): Molecule;
        protected populate(): void;
        private setupPanel;
        private redrawCanvas;
        private drawHighlights;
        private pickAtom;
        private getAtomPos;
        private compatibilityMask;
        private connectAtoms;
        private autoConnect;
        private clearAllMappings;
        private clearMapping;
        private mouseDown;
        private mouseUp;
        private mouseEnter;
        private mouseLeave;
        private mouseMove;
    }
}
declare namespace WebMolKit {
    enum ArrangeComponentType {
        Arrow = 1,
        Plus = 2,
        Reactant = 3,
        Reagent = 4,
        Product = 5,
        StepNote = 6
    }
    enum ArrangeComponentAnnot {
        None = 0,
        Primary = 1,
        Waste = 2,
        Implied = 3
    }
    class ArrangeComponent {
        type: ArrangeComponentType;
        srcIdx: number;
        step: number;
        side: number;
        mol: Molecule;
        text: string[];
        leftNumer: string;
        leftDenom: string;
        fszText: number;
        fszLeft: number;
        annot: ArrangeComponentAnnot;
        monochromeColour: number;
        metaInfo: Record<string, any>;
        box: Box;
        padding: number;
        clone(): ArrangeComponent;
    }
    interface ArrangeExperimentFauxComponent {
        step: number;
        type: ArrangeComponentType;
        mol: Molecule;
        name?: string;
        annot?: ArrangeComponentAnnot;
        colour?: number;
        metaInfo?: any;
    }
    class ArrangeExperiment {
        entry: ExperimentEntry;
        measure: ArrangeMeasurement;
        policy: RenderPolicy;
        scale: number;
        width: number;
        height: number;
        components: ArrangeComponent[];
        limitTotalW: number;
        limitTotalH: number;
        limitStructW: number;
        limitStructH: number;
        includeReagents: boolean;
        includeNames: boolean;
        includeStoich: boolean;
        includeAnnot: boolean;
        includeBlank: boolean;
        includeDetails: boolean;
        includeAtomMap: boolean;
        colourAtomMap: number;
        allowVertical: boolean;
        padding: number;
        fauxComponents: ArrangeExperimentFauxComponent[];
        static COMP_GAP_LEFT: number;
        static COMP_ANNOT_SIZE: number;
        constructor(entry: ExperimentEntry, measure: ArrangeMeasurement, policy: RenderPolicy);
        arrange(): void;
        get numComponents(): number;
        getComponent(idx: number): ArrangeComponent;
        getComponents(): ArrangeComponent[];
        scaleComponents(modScale: number): void;
        static toExpType(compType: ArrangeComponentType): ExperimentComponentType;
        private createComponents;
        private createReactant;
        private createReagent;
        private createProduct;
        private createSegregator;
        private createStepMeta;
        private createBlank;
        private createFauxComponent;
        private arrangeComponents;
        private gatherBlock;
        private arrangeMainBlock;
        private arrangeHorizontalArrowBlock;
        private arrangeVerticalArrowBlock;
        private findMidBlock;
        private scoreArrangement;
        private originateBlock;
        private supplementText;
        private wordWrapName;
    }
}
declare namespace WebMolKit {
    interface ArrangeMeasurement {
        scale(): number;
        angToX(ax: number): number;
        angToY(ay: number): number;
        xToAng(px: number): number;
        yToAng(py: number): number;
        yIsUp(): boolean;
        measureText(str: string, fontSize: number): number[];
    }
    class OutlineMeasurement implements ArrangeMeasurement {
        private offsetX;
        private offsetY;
        private pointScale;
        private invScale;
        constructor(offsetX: number, offsetY: number, pointScale: number);
        scale(): number;
        angToX(ax: number): number;
        angToY(ay: number): number;
        xToAng(px: number): number;
        yToAng(py: number): number;
        yIsUp(): boolean;
        measureText(str: string, fontSize: number): number[];
    }
}
declare namespace WebMolKit {
    interface APoint {
        anum: number;
        text: string;
        fsz: number;
        col: number;
        oval: Oval;
        rotation?: number;
    }
    enum BLineType {
        Normal = 1,
        Inclined = 2,
        Declined = 3,
        Unknown = 4,
        Dotted = 5,
        DotDir = 6,
        IncDouble = 7,
        IncTriple = 8,
        IncQuadruple = 9
    }
    interface BLine {
        bnum: number;
        bfr: number;
        bto: number;
        type: BLineType;
        line: Line;
        size: number;
        head: number;
        col: number;
    }
    interface XRing {
        atoms: number[];
        cx: number;
        cy: number;
        rw: number;
        rh: number;
        size: number;
    }
    interface XPath {
        atoms: number[];
        px: number[];
        py: number[];
        ctrl: boolean[];
        size: number;
    }
    interface SpaceFiller {
        anum: number;
        bnum: number;
        box: Box;
        px: number[];
        py: number[];
    }
    class ArrangeMolecule {
        private mol;
        private measure;
        private policy;
        private effects;
        private scale;
        private bondSepPix;
        private lineSizePix;
        private fontSizePix;
        private ymul;
        private static FONT_CORRECT;
        private points;
        private lines;
        private rings;
        private paths;
        private space;
        private wantArtifacts;
        private artifacts;
        private bondOrder;
        private atomCharge;
        private atomUnpaired;
        private artifactCharge;
        private artifactUnpaired;
        private artifactFract;
        static guestimateSize(mol: Molecule, policy: RenderPolicy, maxW?: number, maxH?: number): number[];
        constructor(mol: Molecule, measure: ArrangeMeasurement, policy: RenderPolicy, effects?: RenderEffects);
        getMolecule(): Molecule;
        getMeasure(): ArrangeMeasurement;
        getPolicy(): RenderPolicy;
        getEffects(): RenderEffects;
        getScale(): number;
        setWantArtifacts(want: boolean): void;
        getArtifacts(): BondArtifact;
        setArtifacts(artifacts: BondArtifact): void;
        arrange(): void;
        numPoints(): number;
        getPoint(idx: number): APoint;
        getPoints(): APoint[];
        numLines(): number;
        getLine(idx: number): BLine;
        getLines(): BLine[];
        numRings(): number;
        getRing(idx: number): XRing;
        getRings(): XRing[];
        numPaths(): number;
        getPath(idx: number): XPath;
        getPaths(): XPath[];
        numSpace(): number;
        getSpace(idx: number): SpaceFiller;
        getSpaces(): SpaceFiller[];
        offsetEverything(dx: number, dy: number): void;
        offsetOrigin(): void;
        scaleEverything(scaleBy: number): void;
        determineBoundary(padding?: number): number[];
        determineBoundaryBox(): Box;
        squeezeInto(x: number, y: number, w: number, h: number, padding?: number): void;
        limitBounds(w: number, h: number): void;
        monochromate(col: number): void;
        clone(): ArrangeMolecule;
        private setupBondOrders;
        private placeAdjunct;
        private processLabel;
        private backOffAtom;
        private shrinkBond;
        private ensureMinimumBondLength;
        private orderedRingList;
        private orthogonalDelta;
        private processDoubleBond;
        private placeHydrogen;
        private computeSpacePoint;
        private computeSpaceLine;
        private bumpAtomPosition;
        private spaceSubset;
        private countPolyViolations;
        private adjustBondPosition;
        private priorityDoubleSubstit;
        private spatialCongestion;
        private annotateAtom;
        private annotateBond;
        private boxOverlaps;
        private resolveLineCrossings;
        private createCircularRing;
        private createCurvedPath;
        private createBondCentroid;
        private splineInterpolate;
        private delocalisedAnnotation;
        private processPolymerUnit;
        private processPolymerUnitPair;
    }
}
declare namespace WebMolKit {
    interface AxisLabellerNotch {
        label: string;
        value: number;
        pos: number;
    }
    class AxisLabeller {
        private width;
        private minVal;
        private maxVal;
        textWidth?: (str: string) => number;
        inverse?: (val: number) => number;
        notches: AxisLabellerNotch[];
        constructor(width: number, minVal: number, maxVal: number, textWidth?: (str: string) => number, inverse?: (val: number) => number);
        calculate(): void;
        private formatNumber;
    }
}
declare namespace WebMolKit {
    class DrawExperiment {
        private layout;
        private vg;
        private entry;
        private measure;
        private policy;
        private scale;
        private invScale;
        preDrawComponent: (vg: MetaVector, idx: number, xc: ArrangeComponent) => void;
        preDrawMolecule: (vg: MetaVector, idx: number, xc: ArrangeComponent, arrmol: ArrangeMolecule) => void;
        postDrawMolecule: (vg: MetaVector, idx: number, xc: ArrangeComponent, arrmol: ArrangeMolecule) => void;
        molDrawn: ArrangeMolecule[];
        constructor(layout: ArrangeExperiment, vg: MetaVector);
        draw(): void;
        private drawComponent;
        private drawSymbolArrow;
        private drawSymbolPlus;
        private drawAnnotation;
        private drawArrow;
    }
}
declare namespace WebMolKit {
    class DrawMolecule {
        private layout;
        private vg;
        private mol;
        private policy;
        private effects;
        private scale;
        private invScale;
        constructor(layout: ArrangeMolecule, vg: MetaVector);
        getMolecule(): Molecule;
        getMetaVector(): MetaVector;
        getLayout(): ArrangeMolecule;
        getPolicy(): RenderPolicy;
        getEffects(): RenderEffects;
        draw(): void;
        private drawUnderEffects;
        private drawOverEffects;
        private drawBondInclined;
        private drawBondDeclined;
        private drawBondUnknown;
        private drawBondDotted;
        private drawBondIncMulti;
    }
}
declare namespace WebMolKit {
    interface FontDataNativeOpt {
        bold?: boolean;
        italic?: boolean;
    }
    class FontData {
        static main: FontData;
        UNITS_PER_EM: number;
        INV_UNITS_PER_EM: number;
        PANOSE_1: string;
        ASCENT: number;
        DESCENT: number;
        MISSING_HORZ: number;
        MISSING_DATA: string;
        ASCENT_FUDGE: number;
        UNICODE: string[];
        HORIZ_ADV_X: number[];
        GLYPH_DATA: string[];
        OUTLINE_X: number[][];
        OUTLINE_Y: number[][];
        KERN_C1: string[];
        KERN_C2: string[];
        KERN_K: number[];
        constructor();
        getKerning(ch1: string, ch2: string): number;
        static measureText(txt: string, size: number): number[];
        measureText(txt: string, size: number): number[];
        static measureWidths(txt: string, size: number): number[];
        measureWidths(txt: string, size: number): number[];
        private pathCache;
        private pathMissing;
        getIndex(ch: string): number;
        getRawGlyph(idx: number): string;
        getGlyphPath(idx: number): Path2D;
        getMissingPath(): Path2D;
        getOutlineX(idx: number): number[];
        getOutlineY(idx: number): number[];
        private ctxReference;
        initNativeFont(ctx?: CanvasRenderingContext2D): void;
        static measureTextNative(txt: string, family: string, size: number, opt?: FontDataNativeOpt): number[];
        measureTextNative(txt: string, family: string, size: number, opt?: FontDataNativeOpt): number[];
    }
}
declare namespace WebMolKit {
    export enum TextAlign {
        Centre = 0,
        Left = 1,
        Right = 2,
        Baseline = 0,
        Middle = 4,
        Top = 8,
        Bottom = 16
    }
    interface TypeObjLine {
        thickness: number;
        colour: number;
    }
    interface TypeObjRect {
        edgeCol: number;
        fillCol: number;
        thickness: number;
    }
    interface TypeObjOval {
        edgeCol: number;
        fillCol: number;
        thickness: number;
    }
    interface TypeObjPath {
        edgeCol: number;
        fillCol: number;
        thickness: number;
        hardEdge: boolean;
    }
    interface TypeObjText {
        size: number;
        colour: number;
    }
    interface TypeObjTextNative {
        family: string;
        size: number;
        colour: number;
        opt: FontDataNativeOpt;
    }
    export class MetaVector {
        static NOCOLOUR: number;
        private types;
        private prims;
        private typeObj;
        width: number;
        height: number;
        offsetX: number;
        offsetY: number;
        scale: number;
        density: number;
        private charMask;
        private charMissing;
        private lowX;
        private lowY;
        private highX;
        private highY;
        constructor(vec?: any);
        drawLine(x1: number, y1: number, x2: number, y2: number, colour: number, thickness: number): void;
        drawRect(x: number, y: number, w: number, h: number, edgeCol: number, thickness: number, fillCol: number): void;
        drawOval(cx: number, cy: number, rw: number, rh: number, edgeCol: number, thickness: number, fillCol: number): void;
        drawPath(xpoints: number[], ypoints: number[], ctrlFlags: boolean[], isClosed: boolean, edgeCol: number, thickness: number, fillCol: number, hardEdge: boolean): void;
        drawPoly(xpoints: number[], ypoints: number[], edgeCol: number, thickness: number, fillCol: number, hardEdge: boolean): void;
        drawText(x: number, y: number, txt: string, size: number, colour: number, align?: number, direction?: number): void;
        drawTextNative(x: number, y: number, txt: string, fontFamily: string, fontSize: number, colour: number, align?: number, opt?: FontDataNativeOpt): void;
        boundLowX(): number;
        boundLowY(): number;
        boundHighX(): number;
        boundHighY(): number;
        getBounds(): Box;
        measure(): void;
        normalise(): void;
        setSize(width: number, height: number): void;
        transformIntoBox(box: Box): void;
        scaleExtent(maxWidth: number, maxHeight: number): void;
        transformPrimitives(ox: number, oy: number, sw: number, sh: number): void;
        renderInto(parent: any): HTMLCanvasElement;
        renderCanvas(canvas: HTMLCanvasElement, clearFirst?: boolean): void;
        renderContext(ctx: CanvasRenderingContext2D): void;
        createSVG(prettyPrint?: boolean, withXlink?: boolean): string;
        renderSVG(svg: Element, withXlink?: boolean): void;
        spool(into: MetaVector): void;
        setupTypeLine(t: any[]): TypeObjLine;
        setupTypeRect(t: any[]): TypeObjRect;
        setupTypeOval(t: any[]): TypeObjOval;
        setupTypePath(t: any[]): TypeObjPath;
        setupTypeText(t: any[]): TypeObjText;
        setupTypeTextNative(t: any[]): TypeObjTextNative;
        renderLine(ctx: CanvasRenderingContext2D, p: any): void;
        renderRect(ctx: CanvasRenderingContext2D, p: any): void;
        renderOval(ctx: CanvasRenderingContext2D, p: any): void;
        renderPath(ctx: CanvasRenderingContext2D, p: any): void;
        private renderText;
        private renderTextNative;
        svgLine1(svg: Element, p: any): void;
        svgLineN(svg: Element, p: any, pos: number, sz: number): void;
        svgRect1(svg: Element, p: any): void;
        svgRectN(svg: Element, p: any, pos: number, sz: number): void;
        svgOval1(svg: Element, p: any): void;
        svgOvalN(svg: Element, p: any, pos: number, sz: number): void;
        svgPath(svg: Element, p: any): void;
        private svgText;
        private svgTextNative;
        private defineSVGStroke;
        private defineSVGFill;
        private findOrCreateType;
        private updateBounds;
    }
    export {};
}
declare namespace WebMolKit {
    interface RenderData {
        name: string;
        pointScale: number;
        resolutionDPI: number;
        fontSize: number;
        lineSize: number;
        bondSep: number;
        defaultPadding: number;
        foreground: number;
        background: number;
        atomCols: number[];
    }
    export class RenderPolicy {
        data: RenderData;
        constructor(data?: RenderData);
        clone(): RenderPolicy;
        static defaultBlackOnWhite(pixPerAng?: number): RenderPolicy;
        static defaultWhiteOnBlack(pixPerAng?: number): RenderPolicy;
        static defaultColourOnWhite(pixPerAng?: number): RenderPolicy;
        static defaultColourOnBlack(pixPerAng?: number): RenderPolicy;
        static defaultPrintedPublication(): RenderPolicy;
    }
    export class RenderEffects {
        colAtom: Record<number, number>;
        colBond: Record<number, number>;
        dottedRectOutline: Record<number, number>;
        dottedBondCross: Record<number, number>;
        hideAtoms: Set<number>;
        hideBonds: Set<number>;
        atomFrameDotSz: number[];
        atomFrameCol: number[];
        atomCircleSz: number[];
        atomCircleCol: number[];
        atomDecoText: string[];
        atomDecoCol: number[];
        atomDecoSize: number[];
        bondDecoText: string[];
        bondDecoCol: number[];
        bondDecoSize: number[];
        overlapAtoms: number[];
    }
    export {};
}
declare namespace WebMolKit {
    interface ButtonBankItem {
        id: string;
        imageFN?: string;
        metavec?: any;
        helpText: string;
        isSubMenu?: boolean;
        mnemonic?: string;
        key?: string;
        text?: string;
    }
    abstract class ButtonBank {
        buttonView: ButtonView;
        isSubLevel: boolean;
        buttons: ButtonBankItem[];
        constructor();
        init(): void;
        abstract update(): void;
        abstract hitButton(id: string): void;
        claimKey(event: KeyboardEvent): boolean;
        bankClosed(): void;
        static matchKey(event: KeyboardEvent, mnemonic: string, key: string): boolean;
    }
}
declare namespace WebMolKit {
    enum CommandType {
        Main = 0,
        Atom = 1,
        Bond = 2,
        Select = 3,
        Move = 4,
        Abbrev = 5,
        SBlock = 6,
        PBlock = 7,
        DBlock = 8,
        FBlock = 9,
        Noble = 10
    }
    export class CommandBank extends ButtonBank {
        protected owner: any;
        protected cmdType: CommandType;
        constructor(owner: any, cmdType?: CommandType);
        update(): void;
        private populateElements;
        hitButton(id: string): void;
        claimKey(event: KeyboardEvent): boolean;
    }
    export {};
}
declare namespace WebMolKit {
    class ContextSketch {
        private state;
        private sketcher;
        private proxyClip;
        constructor(state: SketchState, sketcher: Sketcher, proxyClip: ClipboardProxy);
        populate(): MenuProxyContext[];
        private maybeAppend;
        private rotateSubMenu;
        private querySubMenu;
    }
}
declare namespace WebMolKit {
    class Widget {
        protected tagType: string;
        private domContent;
        get content(): JQuery;
        get contentDOM(): DOM;
        constructor();
        render(parent: any): void;
        remove(): void;
        addTooltip(bodyHTML: string, titleHTML?: string): void;
    }
}
declare namespace WebMolKit {
    export enum DraggingTool {
        None = 0,
        Press = 1,
        Lasso = 2,
        Pan = 3,
        Zoom = 4,
        Rotate = 5,
        Move = 6,
        Erasor = 7,
        Atom = 8,
        Bond = 9,
        Charge = 10,
        Ring = 11
    }
    export enum DrawCanvasDecoration {
        None = 0,
        Stereochemistry = 1,
        MappingNumber = 2,
        AtomIndex = 3
    }
    interface DrawCanvasViewOpt {
        decoration: DrawCanvasDecoration;
        showOxState: boolean;
        showQuery: boolean;
        showArtifacts: boolean;
    }
    export class DrawCanvas extends Widget implements ArrangeMeasurement {
        protected mol: Molecule;
        protected policy: RenderPolicy;
        protected abbrevPolicy: RenderPolicy;
        protected offsetX: number;
        protected offsetY: number;
        protected pointScale: number;
        protected viewOpt: DrawCanvasViewOpt;
        protected width: number;
        protected height: number;
        protected border: number;
        protected borderRadius: number;
        protected background: number;
        protected container: DOM;
        protected divInfo: DOM;
        protected canvasUnder: DOM;
        protected canvasMolecule: DOM;
        protected canvasOver: DOM;
        protected divMessage: DOM;
        protected layout: ArrangeMolecule;
        protected metavec: MetaVector;
        protected stereo: Stereochemistry;
        protected guidelines: GuidelineSprout[];
        protected filthy: boolean;
        protected dragType: DraggingTool;
        protected currentAtom: number;
        protected currentBond: number;
        protected hoverAtom: number;
        protected hoverBond: number;
        protected selectedMask: boolean[];
        protected opAtom: number;
        protected opBond: number;
        protected opBudged: boolean;
        protected opShift: boolean;
        protected opCtrl: boolean;
        protected opAlt: boolean;
        protected lassoX: number[];
        protected lassoY: number[];
        protected lassoMask: boolean[];
        protected clickX: number;
        protected clickY: number;
        protected mouseX: number;
        protected mouseY: number;
        protected dragGuides: GuidelineSprout[];
        protected templatePerms: TemplatePermutation[];
        protected currentPerm: number;
        protected fusionBank: FusionBank;
        protected cursorWatermark: number;
        protected cursorDX: number;
        protected cursorDY: number;
        protected toolAtomSymbol: string;
        protected toolBondOrder: number;
        protected toolBondType: number;
        protected toolChargeDelta: number;
        protected toolRingArom: boolean;
        protected toolRingFreeform: boolean;
        protected toolRotateIncr: number;
        protected redrawCacheKey: string;
        constructor();
        render(parent: any): void;
        getState(): SketchState;
        getSelected(atom: number): boolean;
        getLassoed(atom: number): boolean;
        scale(): number;
        angToX(ax: number): number;
        angToY(ay: number): number;
        xToAng(px: number): number;
        yToAng(py: number): number;
        scaleToAng(scale: number): number;
        angToScale(ang: number): number;
        yIsUp(): boolean;
        measureText(str: string, fontSize: number): number[];
        protected delayedRedraw(): void;
        protected layoutMolecule(): void;
        protected redrawMetaVector(): void;
        protected redraw(): void;
        protected redrawInfo(): void;
        protected redrawUnder(): void;
        protected redrawMolecule(): void;
        protected redrawOver(): void;
        protected subjectAtoms(allIfNone?: boolean, useOpAtom?: boolean): number[];
        protected updateLasso(x: number, y: number): void;
        protected calculateLassoMask(): void;
        private drawAtomShade;
        private drawBondShade;
        private drawOriginatingBond;
        private drawQueryFeatures;
        private drawPolymerUnit;
        protected determineFauxRing(): [number[], number[]];
        protected determineDragTheta(): [number, number, number, number];
        protected determineMoveDelta(): [number, number];
        protected snapToGuide(x: number, y: number): [number, number, boolean];
        protected pickObjectCanvas(x: number, y: number, opt?: {
            noAtoms?: boolean;
            noBonds?: boolean;
        }): number;
        protected pickObject(x: number, y: number, opt?: {
            noAtoms?: boolean;
            noBonds?: boolean;
        }): number;
        private sketchEffects;
        private orientAbbreviation;
    }
    export {};
}
declare namespace WebMolKit {
    class EditAtom extends Dialog {
        atom: number;
        private proxyClip;
        private callbackApply;
        mol: Molecule;
        newX: number;
        newY: number;
        private initMol;
        private btnApply;
        private tabs;
        private inputSymbol;
        private inputCharge;
        private inputUnpaired;
        private optionHydrogen;
        private inputHydrogen;
        private optionIsotope;
        private inputIsotope;
        private inputMapping;
        private inputIndex;
        private periodicWidget;
        private abbrevList;
        private inputAbbrevSearch;
        private tableAbbrev;
        private svgAbbrev;
        private abbrevEntries;
        private abbrevIndices;
        private currentAbbrev;
        private inputGeom1;
        private inputGeom2;
        private geomWidget;
        private refGeom1;
        private refGeom2;
        private queryWidget;
        private fieldsWidget;
        constructor(mol: Molecule, atom: number, proxyClip: ClipboardProxy, callbackApply: (source?: EditAtom) => void);
        protected populate(): void;
        close(): void;
        private applyChanges;
        private populateAtom;
        private populateAbbreviation;
        private populateGeometry;
        private populateQuery;
        private populateExtra;
        private updateMolecule;
        private updateAbbrev;
        private updateGeometry;
        private updateQuery;
        private updateExtra;
        private fillAbbreviations;
        private selectAbbreviation;
        private cycleAbbreviation;
        private selectedTab;
    }
}
declare namespace WebMolKit {
    class EditBond extends Dialog {
        bond: number;
        private proxyClip;
        private callbackApply;
        mol: Molecule;
        private initMol;
        private btnApply;
        private tabs;
        private optionOrder;
        private optionStereo;
        private inputFrom;
        private inputTo;
        private inputIndex;
        private inputGeom1;
        private geomWidget;
        private refGeom1;
        private queryWidget;
        private fieldsWidget;
        constructor(mol: Molecule, bond: number, proxyClip: ClipboardProxy, callbackApply: (source?: EditBond) => void);
        protected populate(): void;
        close(): void;
        private applyChanges;
        private populateBond;
        private populateGeometry;
        private populateQuery;
        private populateExtra;
        private updateMolecule;
        private updateGeometry;
        private updateQuery;
        private updateExtra;
        private selectedTab;
    }
}
declare namespace WebMolKit {
    class EditPolymer extends Dialog {
        atoms: number[];
        private proxyClip;
        private callbackApply;
        mol: Molecule;
        private initMol;
        private btnApply;
        private btnRemove;
        private optionConnect;
        private optionBondConn;
        private divPreview;
        private polymer;
        private currentID;
        private unit;
        private borderAtoms;
        private outBonds;
        private outAtoms;
        private umap;
        private umol;
        constructor(mol: Molecule, atoms: number[], proxyClip: ClipboardProxy, callbackApply: (source?: EditPolymer) => void);
        protected populate(): void;
        close(): void;
        private populate2x2Conn;
        private populateUncap;
        private applyChanges;
        private applyRemove;
        private renderUnit;
    }
}
declare namespace WebMolKit {
    class ExtraFieldsWidget extends Widget {
        private fields;
        private divFields;
        constructor(fields: string[]);
        render(parent: any): void;
        getExtraFields(): string[];
        getTransientFields(): string[];
        private fillTable;
    }
}
declare namespace WebMolKit {
    enum GeomWidgetType {
        Atom = 0,
        Bond = 1
    }
    enum GeomWidgetSelType {
        Position = 0,
        Link = 1,
        Torsion = 2
    }
    interface GeomWidgetSelection {
        type: GeomWidgetSelType;
        idx: number;
    }
    class GeomWidget extends Widget {
        private type;
        private mol;
        private idx;
        callbackSelect: (sel: GeomWidgetSelection) => void;
        selected: GeomWidgetSelection;
        private atomSubset;
        private scale;
        private posX;
        private posY;
        private posRad;
        private linkA;
        private linkB;
        private torsA;
        private torsB;
        private hovered;
        private divDiagram;
        constructor(type: GeomWidgetType, mol: Molecule, idx: number);
        render(parent: any): void;
        selectionAtoms(sel: GeomWidgetSelection): number[];
        private redraw;
        private mouseClick;
        private mouseMove;
        private whichSelection;
        private sameSelection;
    }
}
declare namespace WebMolKit {
    class MetalLigate {
        private metalAtom;
        private ligandAttach;
        private mol;
        private ligands;
        constructor(mol: Molecule, metalAtom: number, ligandAttach: number[]);
        generate(): Molecule;
        private makeLigandBond;
        private orientLigand;
        private arrangeLigandsFree;
        private arrangeLigandsRange;
        private determineThetaBounds;
        private resolveClashes;
    }
}
declare namespace WebMolKit {
    enum ActivityType {
        Delete = 1,
        Clear = 2,
        Copy = 3,
        Cut = 4,
        SelectAll = 5,
        SelectNone = 6,
        SelectPrevComp = 7,
        SelectNextComp = 8,
        SelectSide = 9,
        SelectGrow = 10,
        SelectShrink = 11,
        SelectChain = 12,
        SelectSmRing = 13,
        SelectRingBlk = 14,
        SelectCurElement = 15,
        SelectToggle = 16,
        SelectUnCurrent = 17,
        Element = 18,
        AtomPos = 19,
        Charge = 20,
        Connect = 21,
        Disconnect = 22,
        MetalLigate = 23,
        BondOrder = 24,
        BondType = 25,
        BondGeom = 26,
        BondAtom = 27,
        BondSwitch = 28,
        BondRotate = 29,
        BondAddTwo = 30,
        BondInsert = 31,
        Join = 32,
        Nudge = 33,
        NudgeLots = 34,
        NudgeFar = 35,
        Flip = 36,
        Scale = 37,
        Rotate = 38,
        BondDist = 39,
        AlignAngle = 40,
        AlignRegular = 41,
        AdjustTorsion = 42,
        Move = 43,
        Ring = 44,
        TemplateFusion = 45,
        AbbrevTempl = 46,
        AbbrevGroup = 47,
        AbbrevFormula = 48,
        AbbrevClear = 49,
        AbbrevExpand = 50,
        BondArtifactPath = 51,
        BondArtifactRing = 52,
        BondArtifactArene = 53,
        BondArtifactClear = 54,
        PolymerBlock = 55,
        AddHydrogens = 56,
        RemoveHydrogens = 57,
        QueryClear = 58,
        QueryCopy = 59,
        QueryPaste = 60,
        QuerySetAtom = 61,
        QuerySetBond = 62,
        QueryBondAny = 63
    }
    interface SketchState {
        mol: Molecule;
        currentAtom: number;
        currentBond: number;
        selectedMask: boolean[];
        permutations?: FusionPermutation[];
    }
    interface TemplatePermutation {
        mol: string;
        display: string;
        molidx: number[];
        temidx: number[];
        srcidx: number[];
        metavec?: MetaVector;
    }
    class MoleculeActivity {
        input: SketchState;
        activity: ActivityType;
        private param;
        private owner?;
        private subjectMask;
        private subjectIndex;
        private subjectLength;
        private hasSelected;
        output: SketchState;
        errmsg: string;
        toClipboard: string;
        constructor(input: SketchState, activity: ActivityType, param: Record<string, any>, owner?: Sketcher);
        setOwner(owner: any): void;
        evaluate(): boolean;
        execute(): void;
        private finish;
        execDelete(): void;
        execCopy(withCut: boolean): void;
        execClear(): void;
        execSelectAll(all: boolean): void;
        execSelectComp(dir: number): void;
        execSelectSide(): void;
        execSelectGrow(): void;
        execSelectShrink(): void;
        execSelectChain(): void;
        execSelectSmRing(): void;
        execSelectRingBlk(): void;
        execSelectCurElement(): void;
        execSelectToggle(): void;
        execSelectUnCurrent(): void;
        execElement(element: string, positionX?: number, positionY?: number, keepAbbrev?: boolean): void;
        execCharge(delta: number): void;
        execConnect(order: number, type: number): void;
        execDisconnect(): void;
        execMetalLigate(): void;
        execBond(order: number, type: number): void;
        execBondGeom(geom: number): void;
        execBondAtom(order: number, type: number, element: string, x1: number, y1: number, x2: number, y2: number): void;
        execBondSwitch(): void;
        execBondRotate(): void;
        execBondAddTwo(): void;
        execBondInsert(): void;
        execJoin(): void;
        execNudge(dir: string, extent: number): void;
        execNudgeFar(dir: string): void;
        execFlip(axis: string): void;
        execScale(mag: number): void;
        execRotate(theta: number, centreX: number, centreY: number): void;
        execBondDist(dist: number): void;
        execAlignAngle(angle: number): void;
        execAlignRegular(): void;
        execAdjustTorsion(angle: number): void;
        execMove(refAtom: number, deltaX: number, deltaY: number): void;
        execRing(ringX: number[], ringY: number[], aromatic: boolean): void;
        execTemplateFusion(frag: Molecule): void;
        execAbbrevTempl(): void;
        execAbbrevGroup(): void;
        execAbbrevFormula(): void;
        execAbbrevClear(): void;
        execAbbrevExpand(): void;
        execBondArtifact(activity: ActivityType): void;
        execPolymerBlock(): void;
        execAddHydrogens(): void;
        execRemoveHydrogens(): void;
        execQueryClear(): void;
        execQueryCopy(): void;
        execQueryPaste(): void;
        execQuerySetAtom(): void;
        execQuerySetBond(): void;
        execQueryBondAny(): void;
        private requireSubject;
        private requireAtoms;
        private requireCurrent;
        private requireSelected;
        private pickSelectedGroup;
        private zapSubject;
        private performBondNew;
        private performBondChange;
        private performBondGeomAtom;
        private performBondGeomBond;
        private checkAbbreviationReady;
        private mobileSide;
        private isSelected;
        private removePolymerBlock;
    }
}
declare namespace WebMolKit {
    class PeriodicTableWidget extends Widget {
        private callbackSelect;
        private callbackDoubleClick;
        private divList;
        private selectedAtno;
        constructor();
        render(parent: any): void;
        onSelect(callback: (element: string) => void): void;
        onDoubleClick(callback: () => void): void;
        changeElement(element: string): void;
    }
}
declare namespace WebMolKit {
    class QueryFieldsWidget extends Widget {
        private mol;
        private atom;
        private bond;
        private inputCharges;
        private optAromatic;
        private chkNotElements;
        private inputElements;
        private chkNotRingSizes;
        private inputRingSizes;
        private optRingBlock;
        private inputNumRings;
        private inputAdjacency;
        private inputBondSums;
        private inputValences;
        private inputHydrogens;
        private inputIsotopes;
        private inputOrders;
        constructor(mol: Molecule, atom: number, bond: number);
        render(parent: any): void;
        updateAtom(): void;
        updateBond(): void;
        private setupAtom;
        private setupBond;
        private splitStrings;
        private splitNumbers;
    }
}
declare namespace WebMolKit {
    class Sketcher extends DrawCanvas {
        onChangeMolecule: (mol: Molecule) => void;
        inDialog: boolean;
        initialFocus: boolean;
        useToolBank: boolean;
        lowerToolBank: boolean;
        useCommandBank: boolean;
        lowerCommandBank: boolean;
        useTemplateBank: boolean;
        lowerTemplateBank: boolean;
        debugOutput: any;
        private beenSetup;
        private undoStack;
        private redoStack;
        private fadeWatermark;
        private toolView;
        private commandView;
        private templateView;
        private proxyClip;
        private proxyMenu;
        private static UNDO_SIZE;
        constructor();
        setSize(width: number, height: number): void;
        defineMolecule(mol: Molecule, withAutoScale?: boolean, withStashUndo?: boolean, keepSelect?: boolean): void;
        defineClipboard(proxy: ClipboardProxy): void;
        defineContext(proxy: MenuProxy): void;
        defineMoleculeString(molsk: string, withAutoScale: boolean, withStashUndo: boolean): void;
        defineRenderPolicy(policy: RenderPolicy): void;
        defineBackground(borderCol?: number, borderRad?: number, bgCol?: number): void;
        clearMolecule(): void;
        getMolecule(): Molecule;
        setup(callback: () => void): void;
        setupAsync(): Promise<void>;
        render(parent: any): void;
        get decoration(): DrawCanvasDecoration;
        set decoration(decoration: DrawCanvasDecoration);
        get showOxState(): boolean;
        set showOxState(showOxState: boolean);
        get showQuery(): boolean;
        set showQuery(showQuery: boolean);
        get showArtifacts(): boolean;
        set showArtifacts(showArtifacts: boolean);
        changeSize(width: number, height: number): void;
        showMessage(msg: string, isError?: boolean): void;
        clearMessage(): void;
        autoScale(): void;
        anySelected(): boolean;
        setSelected(atom: number, sel: boolean): void;
        private changeCurrentAtom;
        private changeCurrentBond;
        clearSubject(): void;
        setState(state: SketchState, withStashUndo?: boolean): void;
        stashUndo(): void;
        setPermutations(perms: TemplatePermutation[]): void;
        stopTemplateFusion(): void;
        clearPermutations(): void;
        templateAccept(): void;
        templateRotate(dir: number): void;
        canUndo(): boolean;
        canRedo(): boolean;
        performUndo(): void;
        performRedo(): void;
        performCopy(mol?: Molecule): void;
        performCopySelection(andCut: boolean): void;
        performPaste(): void;
        performActivity(activity: ActivityType, param?: Record<string, any>): void;
        zoom(mag: number): void;
        editCurrent(): void;
        pasteText(str: string): void;
        pasteMolecule(mol: Molecule): void;
        pickTemplatePermutation(idx: number): void;
        performPolymerBlock(atoms: number[]): void;
        grabFocus(): void;
        hasFocus(): boolean;
        private centreAndShrink;
        private layoutTemplatePerm;
        private renderMolecule;
        protected pickObjectCanvas(x: number, y: number): number;
        private updateHoverCursor;
        private determineDragGuide;
        private determineMoveGuide;
        private editAtom;
        private editBond;
        private hitArrowKey;
        private cursorJumpDirection;
        private jumpFromCurrentAtom;
        private jumpFromCurrentBond;
        private jumpFromNowhere;
        private createRing;
        private mouseClick;
        private mouseDoubleClick;
        private mouseDown;
        private mouseUp;
        private mouseOver;
        private mouseOut;
        private mouseMove;
        private keyPressed;
        private keyDown;
        private keyUp;
        private touchStart;
        private touchMove;
        private touchCancel;
        private touchEnd;
        private mouseWheel;
        private contextMenu;
        private interactStart;
        protected interactDrag(x: number, y: number): void;
        private interactEnd;
        private interactEndClick;
        private interactEndDrag;
        private dropInto;
        private connectPolymerBlock;
    }
}
declare namespace WebMolKit {
    class TemplateBank extends ButtonBank {
        protected owner: any;
        protected group?: string;
        private static resourceList;
        private static resourceData;
        private subgroups;
        private templates;
        constructor(owner: any, group?: string);
        init(): void;
        update(): void;
        private populateGroups;
        private populateTemplates;
        hitButton(id: string): void;
        private loadResourceData;
        private prepareSubGroups;
        private prepareTemplates;
    }
    class FusionBank extends ButtonBank {
        protected owner: any;
        constructor(owner: any);
        update(): void;
        hitButton(id: string): void;
        bankClosed(): void;
    }
}
declare namespace WebMolKit {
    class FusionPermutation {
        mol: Molecule;
        display: Molecule;
        molidx: number[];
        temidx: number[];
        srcidx: number[];
        attdist: number;
        guided: boolean;
        bridged: boolean;
        scoreModifier: number;
        chainSelect: number;
    }
    class TemplateFusion {
        mol: Molecule;
        templ: Molecule;
        abbrev: string;
        perms: FusionPermutation[];
        numAttach: number;
        withGuideOnly: boolean;
        private guidetempl;
        private guideidx;
        private guideadj;
        timeLimit: number;
        static RESERVED_GUIDESYMBOL: string;
        constructor(mol: Molecule, templ: Molecule, abbrev: string);
        permuteNone(): void;
        permuteAtom(atom: number): void;
        permuteBond(a1: number, a2: number): void;
        permuteMulti(atoms: number[]): void;
        private huntForGuides;
        private composeDirectOne;
        private composeDirectTwo;
        private composeDirectMulti;
        private composeBridge;
        private composeGuidedOne;
        private composeGuidedTwo;
        private composeGuidedMulti;
        private affixRawPermutations;
        private removeExtraGuides;
        private scorePermutation;
        private sourceIndex;
        private asMask;
    }
}
declare namespace WebMolKit {
    enum ToolBankItem {
        Arrow = "arrow",
        Rotate = "rotate",
        Pan = "pan",
        Drag = "drag",
        Erasor = "erasor",
        BondOrder0 = "bond:Order0",
        BondOrder1 = "bond:Order1",
        BondOrder2 = "bond:Order2",
        BondOrder3 = "bond:Order3",
        BondUnknown = "bond:Unknown",
        BondInclined = "bond:Inclined",
        BondDeclined = "bond:Declined",
        RingAliph = "ringAliph",
        RingArom = "ringArom",
        AtomPlus = "atomPlus",
        AtomMinus = "atomMinus",
        BondPfx = "bond:",
        ElementPfx = "element:"
    }
    class ToolBank extends ButtonBank {
        protected owner: any;
        constructor(owner: any);
        update(): void;
        hitButton(id: string): void;
        claimKey(event: KeyboardEvent): boolean;
    }
}
declare namespace WebMolKit {
    enum ButtonViewPosition {
        Left = 0,
        Right = 1,
        Top = 2,
        Bottom = 3,
        Centre = 4
    }
    interface ButtonViewDisplay {
        id: string;
        x?: number;
        y?: number;
        width?: number;
        height?: number;
        helpSpan?: DOM;
        imgDOM?: DOM;
    }
    class ButtonView extends Widget {
        private position;
        private parentX;
        private parentY;
        private parentWidth;
        private parentHeight;
        idealSize: number;
        width: number;
        height: number;
        selectedButton: string;
        highlightButton: string;
        maxButtonColumns: number;
        maxButtonRows: number;
        private border;
        private background;
        private buttonColNorm1;
        private buttonColNorm2;
        private buttonColActv1;
        private buttonColActv2;
        private buttonColSel1;
        private buttonColSel2;
        private canvas;
        private stack;
        private display;
        private hasBigButtons;
        private prefabImgSize;
        private gripHeight;
        private gripWidth;
        private isRaised;
        private outPadding;
        private inPadding;
        private x;
        private y;
        private isMacLike;
        constructor(position: ButtonViewPosition, parentX: number, parentY: number, parentWidth: number, parentHeight: number);
        setParentSize(width: number, height: number): void;
        get topBank(): ButtonBank;
        get stackSize(): number;
        render(parent: any): void;
        pushBank(bank: ButtonBank): void;
        popBank(): void;
        refreshBank(): void;
        getSelectedButton(): string;
        setSelectedButton(id: string): void;
        cycleSelected(dir: number): void;
        raiseBank(): void;
        lowerBank(): void;
        getHasBigButtons(): boolean;
        setHasBigButtons(flag: boolean): void;
        withinOutline(x: number, y: number): boolean;
        gripSize(): number;
        sizeForButtons(nbtn: number): number;
        private layoutButtons;
        private addGripButton;
        private replaceCanvas;
        private removeDisplayButtons;
        private applyOffset;
        private redraw;
        private delayedRedraw;
        private buttonFromID;
        private displayFromID;
        private traceOutline;
        private layoutMaxWidth;
        private layoutMaxHeight;
        private scoreLayout;
        private pickButtonIndex;
        private pickButtonID;
        private triggerButton;
        private mouseClick;
        private mouseDoubleClick;
        private mouseDown;
        private mouseUp;
        private mouseOver;
        private mouseOut;
        private mouseMove;
    }
}
declare namespace WebMolKit {
    class CircleButton extends Widget {
        private icon;
        private state;
        private isHighlight;
        private isPressed;
        private normalBackgr;
        private selectedBackgr;
        private pressedBackgr;
        private disabledBackgr;
        private ringProgress;
        private thinBorder;
        private thickBorder;
        private svg;
        private progressFraction;
        callbackAction: (source?: CircleButton) => void;
        constructor(icon: string);
        render(parent: any): void;
        setProgress(fraction: number): void;
        clearProgress(): void;
        private updateLayers;
        private mouseEnter;
        private mouseLeave;
        private mouseDown;
        private mouseUp;
        private mouseClicked;
    }
}
declare namespace WebMolKit {
    class ClipboardProxyHandler {
        copyEvent(andCut: boolean, proxy: ClipboardProxy): boolean;
        pasteEvent(proxy: ClipboardProxy): boolean;
    }
    class ClipboardProxy {
        protected handlers: ClipboardProxyHandler[];
        pushHandler(handler: ClipboardProxyHandler): void;
        popHandler(): void;
        currentHandler(): ClipboardProxyHandler;
        triggerCopy(andCut: boolean): void;
        triggerPaste(): void;
        getString(): string;
        setString(str: string): void;
        setImage(blob: Blob): void;
        canSetHTML(): boolean;
        setHTML(html: string): void;
        canAlwaysGet(): boolean;
        downloadString(str: string, fn: string): void;
    }
    class ClipboardProxyWeb extends ClipboardProxy {
        private lastContent;
        private fakeTextArea;
        private busy;
        constructor();
        getString(): string;
        setString(str: string): void;
        setImage(blob: Blob): void;
    }
}
declare namespace WebMolKit {
    class EmbedChemistry extends Widget {
        padding: number;
        borderCol: number;
        borderRadius: number;
        backgroundCol1: number;
        backgroundCol2: number;
        policy: RenderPolicy;
        constructor();
        clearBackground(): void;
        setBackground(bg: number): void;
        setBackgroundGradient(bg1: number, bg2: number): void;
        render(parent: any): void;
    }
}
declare namespace WebMolKit {
    class EmbedCollection extends EmbedChemistry {
        private datastr;
        private ds;
        private failmsg;
        private tight;
        constructor(datastr: string, options?: any);
        render(parent: any): void;
        private determineColumns;
        private renderPrimitive;
        private renderMolecule;
        private renderTextAspect;
        private renderGraphicAspect;
    }
}
declare namespace WebMolKit {
    class EmbedMolecule extends EmbedChemistry {
        private molstr;
        private mol;
        private name;
        private failmsg;
        private maxWidth;
        private maxHeight;
        private boxSize;
        private tight;
        constructor(molstr: string, options?: any);
        render(parent: any): void;
    }
}
declare namespace WebMolKit {
    enum EmbedReactionFacet {
        HEADER = "header",
        SCHEME = "scheme",
        QUANTITY = "quantity",
        METRICS = "metrics"
    }
    class EmbedReaction extends EmbedChemistry {
        private datastr;
        private row;
        private entry;
        private failmsg;
        private tight;
        private facet;
        private limitTotalW;
        private includeStoich;
        private includeAnnot;
        constructor(datastr: string, options?: any);
        render(parent: any): void;
        private renderHeader;
        private renderScheme;
        private renderQuantity;
        private renderComponentText;
        private renderMetrics;
        private combineQuant;
        private sumQuant;
        private sumQuantExt;
        private drawTotals;
        private static PTN_DOI1;
        private static PTN_DOI2;
        private static PTN_ISBN;
        private doiToLink;
    }
}
declare namespace WebMolKit {
    interface MenuProxyContext {
        label: string;
        click?: () => void;
        subMenu?: MenuProxyContext[];
        accelerator?: string;
    }
    class MenuProxy {
        hasContextMenu(): boolean;
        openContextMenu(menuItems: MenuProxyContext[], event: JQueryMouseEventObject | MouseEvent): void;
    }
    class MenuProxyWeb extends MenuProxy {
        hasContextMenu(): boolean;
        openContextMenu(menuItems: MenuProxyContext[], event: JQueryMouseEventObject | MouseEvent): void;
    }
}
declare namespace WebMolKit {
    class OptionList extends Widget {
        options: string[];
        private isVertical;
        padding: number;
        htmlLabels: boolean;
        numCols: number;
        private selidx;
        private buttonDiv;
        private auxCell;
        callbackSelect: (idx: number, source?: OptionList) => void;
        constructor(options: string[], isVertical?: boolean);
        getSelectedIndex(): number;
        getSelectedValue(): string;
        getAuxiliaryCell(idx: number): Element;
        onSelect(callback: (idx: number, source?: OptionList) => void): void;
        render(parent: any): void;
        clickButton(idx: number): void;
        setSelectedIndex(idx: number): void;
        setSelectedValue(val: string): void;
        private updateButtons;
        private composeCSS;
    }
}
declare namespace WebMolKit {
    class Popup {
        private parent;
        protected domObscureBackground: DOM;
        protected domObscureForeground: DOM;
        protected domPanelBoundary: DOM;
        protected domBody: DOM;
        protected get obscureBackground(): JQuery;
        protected get obscureForeground(): JQuery;
        protected get panelBoundary(): JQuery;
        protected get bodyDiv(): JQuery;
        popupBackground: string;
        callbackClose: (source?: Popup) => void;
        callbackPopulate: (source?: Popup) => void;
        constructor(parent: any);
        onClose(callback: (source?: Popup) => void): void;
        open(): void;
        close(): void;
        bump(): void;
        body(): JQuery;
        bodyDOM(): DOM;
        protected populate(): void;
        private positionAndShow;
    }
}
declare namespace WebMolKit {
    class TabBar extends Widget {
        options: string[];
        unionHeight: boolean;
        private selidx;
        private buttonDiv;
        private panelDiv;
        private padding;
        callbackSelect: (idx: number, source?: TabBar) => void;
        constructor(options: string[]);
        onSelect(callback: (idx: number, source?: TabBar) => void): void;
        getSelectedIndex(): number;
        getSelectedValue(): string;
        getPanel(idxOrName: number | string): JQuery;
        getPanelDOM(idxOrName: number | string): DOM;
        render(parent: any): void;
        clickButton(idx: number): void;
        setSelectedIndex(idx: number): void;
        setSelectedValue(val: string): void;
        rotateSelected(dir: number): void;
        private updateButtons;
        private composeCSS;
    }
}
declare namespace WebMolKit {
    function addTooltip(parent: any, bodyHTML: string, titleHTML?: string, delay?: number): void;
    function raiseToolTip(parent: any, avoid: Box, bodyHTML: string, titleHTML?: string): void;
    function clearTooltip(): void;
    class Tooltip {
        private widget;
        private bodyHTML;
        private titleHTML;
        private delay;
        private watermark;
        static ensureGlobal(): void;
        constructor(widget: DOM, bodyHTML: string, titleHTML: string, delay: number);
        start(): void;
        stop(): void;
        raise(avoid?: Box): void;
        lower(): void;
    }
}
declare namespace WebMolKit {
    interface WebMenuItem {
        label: string;
        type?: string;
        click?: () => void;
        submenu?: WebMenuItem[];
    }
    class WebMenu extends Widget {
        private barItems;
        private topItems;
        private obscureBackground;
        constructor(barItems: WebMenuItem[]);
        render(parent: any): void;
        private activateMenu;
        private deactivateMenu;
    }
}
declare namespace WebMolKit {
    class GeomUtil {
        static pointInPolygon(x: number, y: number, px: number[], py: number[]): boolean;
        static areLinesParallel(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, x4: number, y4: number): boolean;
        static lineIntersect(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, x4: number, y4: number): number[];
        static isPointOnLineSeg(px: number, py: number, x1: number, y1: number, x2: number, y2: number): boolean;
        static pointLineDistance(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number;
        static pointLineSegDistance(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number;
        static doLineSegsIntersect(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, x4: number, y4: number): boolean;
        static rectsIntersect(x1: number, y1: number, w1: number, h1: number, x2: number, y2: number, w2: number, h2: number): boolean;
        static sortAngles(theta: number[]): number[];
        static idxSortAngles(theta: number[]): number[];
        static uniqueAngles(theta: number[], threshold: number): number[];
        static thetaObtuse(th1: number, th2: number): number;
        static emergentAngle(theta: number[]): number;
        static dotProduct(v1: number[], v2: number[]): number;
        static crossProduct(v1: number[], v2: number[]): number[];
        static affineTranslate(dx: number, dy: number): number[][];
        static affineMirror(xaxis: boolean, yaxis: boolean): number[][];
        static affineScale(sx: number, sy: number): number[][];
        static affineRotate(theta: number): number[][];
        static affineCompose(A: number[][], B: number[][]): number[][];
        static applyAffine(x: number, y: number, tfm: number[][]): [number, number];
        static applyAffineArray(x: number[], y: number[], tfm: number[][]): void;
        static isAffineMirror(tfm: number[][]): boolean;
        static magnitude2(v: number[]): number;
        static magnitude(v: number[]): number;
        static dist2(v1: number[], v2: number[]): number;
        static dist(v1: number[], v2: number[]): number;
        static normalise(v: number[]): void;
        static normalised(v: number[]): number[];
        static acuteAngle(v1: number[], v2: number[]): number;
        static arcControlPoints(rad: number, x1: number, y1: number, x2: number, y2: number): [number, number, number, number];
        static fitCircle(x: number[], y: number[]): number;
        static fitEllipse(px: number[], py: number[], minX: number, minY: number, maxX: number, maxY: number): number[];
        static superimpose(ax: number[], ay: number[], bx: number[], by: number[]): number[][];
        static convexHull(x: number[], y: number[], flatness: number): [number[], number[]];
        static outlinePolygon(x: number[], y: number[], diameter: number): [number[], number[]];
    }
    class QuickHull {
        private x;
        private y;
        private threshSq;
        private hsz;
        hullX: number[];
        hullY: number[];
        constructor(x: number[], y: number[], threshSq: number);
        private quickHull;
        private right;
        private distance;
        private furthestPoint;
    }
    class RollingBall {
        x: number[];
        y: number[];
        sequence: number[];
        constructor(x: number[], y: number[], diameter: number);
        sequencePos(): Pos[];
        sequenceXY(): [number[], number[]];
    }
    class Pos {
        x: number;
        y: number;
        static zero(): Pos;
        static fromArray(src: number[]): Pos;
        constructor(x?: number, y?: number);
        clone(): Pos;
        equals(other: Pos): boolean;
        scaleBy(mag: number): void;
        offsetBy(dx: number, dy: number): void;
        withScaleBy(mag: number): Pos;
        withOffsetBy(dx: number, dy: number): Pos;
        toString(): string;
    }
    class Size {
        w: number;
        h: number;
        static zero(): Size;
        static fromArray(src: number[]): Size;
        constructor(w?: number, h?: number);
        clone(): Size;
        equals(other: Size): boolean;
        isZero(): boolean;
        scaleBy(mag: number): void;
        fitInto(maxW: number, maxH: number): void;
        withScaleBy(mag: number): Size;
        toString(): string;
    }
    class Box {
        x: number;
        y: number;
        w: number;
        h: number;
        static zero(): Box;
        static fromSize(sz: Size): Box;
        static fromOval(oval: Oval): Box;
        static fromArray(src: number[]): Box;
        constructor(x?: number, y?: number, w?: number, h?: number);
        clone(): Box;
        equals(other: Box): boolean;
        getPos(): Pos;
        setPos(pos: Pos): void;
        getSize(): Size;
        setSize(sz: Size): void;
        isZero(): boolean;
        minX(): number;
        minY(): number;
        midX(): number;
        midY(): number;
        maxX(): number;
        maxY(): number;
        area(): number;
        scaleBy(mag: number): void;
        offsetBy(dx: number, dy: number): void;
        grow(bx: number, by: number): void;
        withScaleBy(mag: number): Box;
        withOffsetBy(dx: number, dy: number): Box;
        withGrow(bx: number, by: number): Box;
        intersects(other: Box): boolean;
        intersection(other: Box): Box;
        contains(x: number, y: number): boolean;
        union(other: Box): Box;
        isEmpty(): boolean;
        notEmpty(): boolean;
        toString(): string;
    }
    class Oval {
        cx: number;
        cy: number;
        rw: number;
        rh: number;
        static zero(): Oval;
        static fromBox(box: Box): Oval;
        static fromArray(src: number[]): Oval;
        constructor(cx?: number, cy?: number, rw?: number, rh?: number);
        clone(): Oval;
        setCentre(pos: Pos): void;
        setRadius(sz: Size): void;
        minX(): number;
        minY(): number;
        maxX(): number;
        maxY(): number;
        scaleBy(mag: number): void;
        offsetBy(dx: number, dy: number): void;
        withScaleBy(mag: number): Oval;
        withOffsetBy(dx: number, dy: number): Oval;
        toString(): string;
    }
    class Line {
        x1: number;
        y1: number;
        x2: number;
        y2: number;
        static zero(): Line;
        constructor(x1?: number, y1?: number, x2?: number, y2?: number);
        clone(): Line;
        setPos1(pos: Pos): void;
        setPos2(pos: Pos): void;
        minX(): number;
        minY(): number;
        maxX(): number;
        maxY(): number;
        scaleBy(mag: number): void;
        offsetBy(dx: number, dy: number): void;
        toString(): string;
    }
}
declare namespace WebMolKit {
    class Matrix {
        m: number;
        n: number;
        A: number[][];
        constructor(m: number, n: number, s?: number);
        static fromArray(A: number[][]): Matrix;
        clone(): Matrix;
        get numRows(): number;
        get numCols(): number;
        get(i: number, j: number): number;
        set(i: number, j: number, v: number): void;
        transpose(): Matrix;
        norm1(): number;
        normInf(): number;
        uminus(): Matrix;
        plus(B: Matrix): Matrix;
        plusEquals(B: Matrix): Matrix;
        minus(B: Matrix): Matrix;
        minusEquals(B: Matrix): Matrix;
        arrayTimes(B: Matrix): Matrix;
        arrayTimesEquals(B: Matrix): Matrix;
        arrayRightDivide(B: Matrix): Matrix;
        arrayRightDivideEquals(B: Matrix): Matrix;
        arrayLeftDivide(B: Matrix): Matrix;
        arrayLeftDivideEquals(B: Matrix): Matrix;
        scalarTimes(s: number): Matrix;
        scalarTimesEquals(s: number): Matrix;
        times(B: Matrix): Matrix;
        rank(): number;
        cond(): number;
        trace(): number;
        static identity(m: number, n: number): Matrix;
        toString(): string;
    }
    class SingularValueDecomposition {
        private U;
        private V;
        private s;
        private m;
        private n;
        constructor(mtx: Matrix);
        getU(): Matrix;
        getV(): Matrix;
        getSingularValues(): number[];
        getS(): Matrix;
        norm2(): number;
        cond(): number;
        rank(): number;
        static hypot(a: number, b: number): number;
    }
}
declare namespace WebMolKit {
    class Random {
        private seed;
        private m;
        private invMN;
        private a;
        private c;
        private state;
        constructor(seed?: number);
        next(): number;
        int(max: number): number;
        float(): number;
        index(arr: any[]): number;
        peek<T>(arr: T[]): T;
        pull<T>(arr: T[]): T;
    }
}
declare namespace WebMolKit {
    class Theme {
        static BASE_URL: string;
        static RESOURCE_URL: string;
        static foreground: number;
        static background: number;
        static lowlight: number;
        static lowlightEdge1: number;
        static lowlightEdge2: number;
        static highlight: number;
        static highlightEdge1: number;
        static highlightEdge2: number;
        static error: number;
    }
    function initWebMolKit(resourcePath: string): void;
    function hasInlineCSS(tag: string): boolean;
    function installInlineCSS(tag: string, css: string): boolean;
}
declare namespace WebMolKit {
    class Triangulation2D {
        px: number[];
        py: number[];
        sz: number;
        numTriangles: number;
        triangles: number[];
        halfedges: number[];
        private edgeStack;
        private hashSize;
        private hullPrev;
        private hullNext;
        private hullTri;
        private hullHash;
        private ids;
        private dists;
        private centreX;
        private centreY;
        private hullStart;
        private hull;
        constructor(px: number[], py: number[]);
        trimConcave(threshold: number): number[];
        traceOutline(tri: number[]): number[];
        private update;
        private hashKey;
        private legalise;
        private link;
        private addTriangle;
        private pseudoAngle;
        private orientIfSure;
        private orient;
        private inCircle;
        private circumRadius;
        private pickCircumCentre;
        private quicksort;
    }
}
declare namespace WebMolKit {
    class Vec {
        static isBlank(arr: any[]): boolean;
        static notBlank(arr: any[]): boolean;
        static safeArray<T>(arr: T[]): T[];
        static len(arr: any[]): number;
        static arrayLength(arr: any[]): number;
        static anyTrue(arr: boolean[]): boolean;
        static allTrue(arr: boolean[]): boolean;
        static anyFalse(arr: boolean[]): boolean;
        static allFalse(arr: boolean[]): boolean;
        static iterAnyTrue<T>(arr: T[], callback: (value: T) => boolean): boolean;
        static iterAllTrue<T>(arr: T[], callback: (value: T) => boolean): boolean;
        static iterAnyFalse<T>(arr: T[], callback: (value: T) => boolean): boolean;
        static iterAllFalse<T>(arr: T[], callback: (value: T) => boolean): boolean;
        static swap(arr: any[], idx1: number, idx2: number): void;
        static duplicate<T>(arr: T[]): T[];
        static append<T>(arr: T[], item: T): T[];
        static prepend<T>(arr: T[], item: T): T[];
        static concat<T>(arr1: T[], arr2: T[]): T[];
        static remove<T>(arr: T[], idx: number): T[];
        static flatten<T>(mtx: T[][]): T[];
        static transpose<T>(mtx: T[][]): T[][];
        static equals(arr1: any[], arr2: any[]): boolean;
        static equivalent(arr1: any[], arr2: any[]): boolean;
        static compareTo<T>(arr1: T[], arr2: T[]): number;
        static booleanArray(val: boolean, sz: number): boolean[];
        static numberArray(val: number, sz: number): number[];
        static stringArray(val: string, sz: number): string[];
        static anyArray(val: any, sz: number): any[];
        static genericArray<T>(val: T, sz: number): T[];
        static genericBlankArrays<T>(sz: number): T[][];
        static funcArray<T>(sz: number, func: (idx?: number) => T): T[];
        static first<T>(arr: T[]): T;
        static last<T>(arr: T[]): T;
        static min(arr: number[]): number;
        static max(arr: number[]): number;
        static idxMin(arr: number[]): number;
        static idxMax(arr: number[]): number;
        static range(arr: number[]): number;
        static reverse<T>(arr: T[]): T[];
        static identity0(sz: number): number[];
        static identity1(sz: number): number[];
        static identityN(start: number, sz: number): number[];
        static notMask(mask: boolean[]): boolean[];
        static idxGet<T>(arr: T[], idx: number[]): T[];
        static maskCount(mask: boolean[]): number;
        static maskIdx(mask: boolean[]): number[];
        static idxMask(idx: number[], sz: number): boolean[];
        static maskMap(mask: boolean[]): number[];
        static maskGet<T>(arr: T[], mask: boolean[]): T[];
        static maskEqual(arr1: any[], val: any): boolean[];
        static sum(arr: number[]): number;
        static add(arr1: number[], val: number | number[]): number[];
        static sub(arr1: number[], val: number | number[]): number[];
        static mul(arr1: number[], val: number | number[]): number[];
        static neg(arr: number[]): number[];
        static setTo(arr: any[], val: any): void;
        static addTo(arr: number[], val: number): void;
        static mulBy(arr: number[], val: number): void;
        static addToArray(arr: number[], val: number[]): void;
        static subFromArray(arr: number[], val: number[]): void;
        static mulByArray(arr: number[], val: number[]): void;
        static divByArray(arr: number[], val: number[]): void;
        static idxSort(arr: any[]): number[];
        static sort(arr: number[]): void;
        static sorted(arr: number[]): number[];
        static sortedUnique<T>(arr: T[]): T[];
        static uniqueUnstable<T>(arr: T[]): T[];
        static uniqueStable<T>(arr: T[]): T[];
        static maskUnique(arr: any[]): boolean[];
        static idxUnique(arr: any[]): number[];
        static exclude<T>(arr: T[], excl: T[]): T[];
    }
    class Permutation {
        static parityPerms(idx: number[]): number;
        static parityIdentity(idx: number[]): number;
        static parityOrder(src: number[]): number;
        private static PERM1;
        private static PERM2;
        private static PERM3;
        private static PERM4;
        static SMALL_PERMS: number;
        static smallPermutation(sz: number): number[][];
        private static MAX_CACHE;
        private static PERM_CACHE;
        static allPermutations(sz: number): number[][];
    }
}
declare namespace WebMolKit {
    class XML {
        static customParser: any;
        static customSerial: any;
        static parseXML(strXML: string): Document;
        static toString(doc: Document): string;
        static toPrettyString(doc: Document): string;
        static nodeText(el: Node): string;
        static childText(parent: Element, tagName: string): string;
        static appendElement(parent: Node, name: string): Element;
        static appendElementAfter(presib: Node, name: string): Element;
        static appendText(parent: Node, text: string, isCDATA?: boolean): void;
        static createTextChild(parent: Node, name: string, text: string, isCDATA?: boolean): void;
        static setText(parent: Node, text: string, isCDATA?: boolean): void;
        static findElement(parent: Element, tagName: string): Element;
        static findChildElements(parent: Element, tagName: string): Element[];
        static childElements(parent: Element): Element[];
    }
}
declare namespace WebMolKit {
    function dom(obj: Element | DOM | string): DOM;
    function domLegacy(obj: any): DOM;
    class DOM {
        el: Element;
        constructor(el: Element);
        get elHTML(): HTMLElement;
        get elInput(): HTMLInputElement;
        get elCanvas(): HTMLCanvasElement;
        static parse(xhtml: string): DOM;
        static find(selector: string): DOM;
        static findAll(selector: string): DOM[];
        parent(): DOM;
        ancestor(selector: string): DOM;
        children(tag?: string): DOM[];
        find(selector: string): DOM;
        findAll(selector: string): DOM[];
        exists(): boolean;
        isVisible(): boolean;
        append(child: DOM): void;
        appendTo(parent: DOM | Element): DOM;
        prepend(child: DOM): void;
        prependTo(parent: DOM | Element): DOM;
        insertBefore(ref: DOM): DOM;
        insertAfter(ref: DOM): DOM;
        remove(): void;
        empty(): void;
        getHTML(): string;
        setHTML(html: string): void;
        appendHTML(xhtml: string): void;
        getText(): string;
        setText(text: string): void;
        appendText(text: string): void;
        getValue(): string;
        setValue(str: string): void;
        getCSS(key: string): string;
        setCSS(key: string, value: string): void;
        css(dict: Record<string, string | number | boolean>): DOM;
        getAttr(key: string): string;
        setAttr(key: string, value: string): void;
        attr(dict: Record<string, string | number | boolean>): DOM;
        addClass(clsnames: string): void;
        removeClass(clsnames: string): void;
        hasClass(clsname: string): boolean;
        setClass(clsname: string, flag: boolean): void;
        class(clsname: string): DOM;
        toggleClass(dict: Record<string, boolean>): void;
        width(): number;
        height(): number;
        offset(): Pos;
        size(): Size;
        setBoundaryPixels(x: number, y: number, w: number, h: number): void;
        hasFocus(): boolean;
        grabFocus(delay?: boolean): void;
        removeEvent(id: string, callback: any): void;
        onKeyDown(callback: (event?: KeyboardEvent) => boolean | void): void;
        onKeyUp(callback: (event?: KeyboardEvent) => boolean | void): void;
        onKeyPress(callback: (event?: KeyboardEvent) => boolean | void): void;
        onScroll(callback: (event?: Event) => boolean | void): void;
        onWheel(callback: (event?: WheelEvent) => boolean | void): void;
        onClick(callback: (event?: MouseEvent) => boolean | void): void;
        onContextMenu(callback: (event?: MouseEvent) => boolean | void): void;
        onDblClick(callback: (event?: MouseEvent) => boolean | void): void;
        onMouseDown(callback: (event?: MouseEvent) => boolean | void): void;
        onMouseUp(callback: (event?: MouseEvent) => boolean | void): void;
        onMouseEnter(callback: (event?: MouseEvent) => boolean | void): void;
        onMouseLeave(callback: (event?: MouseEvent) => boolean | void): void;
        onMouseMove(callback: (event?: MouseEvent) => boolean | void): void;
        onMouseOver(callback: (event?: MouseEvent) => boolean | void): void;
        onChange(callback: (event?: MouseEvent) => boolean | void): void;
        onInput(callback: (event?: MouseEvent) => boolean | void): void;
        onTouchStart(callback: (event?: TouchEvent) => boolean | void): void;
        onTouchMove(callback: (event?: TouchEvent) => boolean | void): void;
        onTouchCancel(callback: (event?: TouchEvent) => boolean | void): void;
        onTouchEnd(callback: (event?: TouchEvent) => boolean | void): void;
    }
}
declare namespace WebMolKit {
    interface ValidationTest {
        title: string;
        func: () => void;
    }
    class Validation {
        private tests;
        setupError: any;
        private recentSuccess;
        private recentError;
        private recentTimeTaken;
        rec: Record<string, any>;
        constructor();
        init(): Promise<void>;
        deinit(): Promise<void>;
        add(title: string, func: () => void): void;
        get count(): number;
        getTitle(idx: number): string;
        runTest(idx: number): Promise<[boolean, string, number]>;
        gasp(): Promise<void>;
        assert(condition: boolean, message?: string): void;
        assertEqual(thing1: any, thing2: any, message?: string): void;
        assertNull(thing: any, message?: string): void;
        assertNotNull(thing: any, message?: string): void;
        fail(message?: string): void;
    }
}
declare namespace WebMolKit {
    class ValidationHeadlessBasic extends Validation {
        constructor();
        vectorIndexSort(): Promise<void>;
        axisLabeller(): Promise<void>;
    }
}
declare namespace WebMolKit {
    class ValidationHeadlessMolecule extends Validation {
        private urlBase;
        private strSketchEl;
        private strMolfile;
        private strDataXML;
        private strSDfile;
        private molStereo;
        private dsCircular;
        private dsRoundtrip;
        constructor(urlBase: string);
        init(): Promise<void>;
        parseSketchEl(): Promise<void>;
        parseMolfile(): Promise<void>;
        parseDataXML(): Promise<void>;
        parseSDfile(): Promise<void>;
        calcStrictArom(): Promise<void>;
        calcStereoChem(): Promise<void>;
        calcFingerprints(): Promise<void>;
        molfileRoundTrip(): Promise<void>;
    }
}
declare namespace WebMolKit {
    class ValidationHeadlessReaction extends Validation {
        private urlBase;
        private strExperiment;
        constructor(urlBase: string);
        init(): Promise<void>;
        confirmAspect(): Promise<void>;
    }
}
declare namespace WebMolKit {
    class WebValExec {
        private validation;
        constructor(validation: Validation);
        runTests(parent: any): Promise<void>;
    }
}
