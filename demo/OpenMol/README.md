# OpenMolecule Specification

The _OpenMolecule_ specification is an abstract datastructure that represents a chemical structure as a collection of atoms and a collection of bonds. The properties of each atom and bond are interchangeable with sketch formats used by chemists and informatics formats used by software.

At its most basic level, the _OpenMolecule_ datastructure is equivalent to the content that can be described with a subset of the MDL Molfile V2000 CTAB format. The datastructure is intentionally not tied to any particular format: serialisation is considered to be an implementation that can be defined at the discretion of the software vendor. The key purpose of _OpenMolecule_ is to establish compatibility: when any two molecule file formats that advertise having the same level of _OpenMolecule_ compatibility, it means that there exists a straightforward transformation that can convert a molecule between the two formats with zero loss of information.

Many file formats besides Molfile CTAB are compatible with various levels of _OpenMolecule_ with few or no modifications, as long as they refrain from using functionality that is beyond the level definition. Any format for which the data can survive _all_ format conversions at a given level is, by definition, compatible with that level.

_OpenMolecule_ is essentially a "2D description", meaning that the coordinates of the atoms are _usually_ meaningful in the context of a flattened sketch representation, and the chemical characteristics are derived from atom and bond labels, rather than the positions of the atoms. Atom position is important for stereochemistry, and it is considered to be a fundamental characteristic of the datastructure, since layout and orientation contains context-specific metadata that is meaningful to chemists.

File formats that are not compatible with _any_ level of _OpenMolecule_ inclined line notations that strip out atom coordinates (e.g. SMILES, InChI); any format that requires algorithmic interpretations to derive basic molecular properties like bond orders or charges (e.g. Mol2, MOE); any format that uses all-atom 3D coordinates to infer chemical properties (e.g. essentially all crystallographic or quantum chemistry formats). File formats that are designed to capture artistic representations of molecules (e.g. native formats of ChemDraw, Biovia Draw, ChemDoodle) are technically compatible with _OpenMolecule_, but they are a large superset of the applicable functionality.

## Level 1.0: lowest common denominator CTAB

The MDL Molfile V2000 CTAB format has a large number of fields that were defined for the benefit of custom software many decades ago, and have little relevance to contemporary needs. There are also sections of functionality that are useful, but rarely implemented, and so it is generally not safe to assume that other software will understand them. The format also defines a number of properties that are used for _queries_ rather than molecule specifications, and these are often misused (e.g. resonance-style bonds for aromaticity). The format has a number of limitations: it is not suitable for most kinds of organometallic or inorganic molecules, without corrections. It also has no way to store metadata that can be safely passed through readers & writers that are not explicitly programmed to understand it.

Many other cheminformatics file formats can support the lowest common denominator that is level 1.0, as long as they refrain from using unsupported functionality, and following consistent conventions. Examples include SketchEl (.el), Marvin Documents (.mrv), Chemical Markup Language (.cml), ChemDoodle JSON (.cwc.js) and numerous others. 

... {TBD: whitelist of features that are allowed; shout out to commonly used/abused features that are not allowed}
... {TBD: and hints about using MDL Molfile header to encode the OpenMolecule level}

## Level 1.1: many atoms

This level is idential to the previous one, except that 1000 atom/bond limit is removed. This advance has its own incremental definition for pragmatic purposes: the vast majority of useful cheminformatics data is stored in (or has passed through) the Molfile V2000 format, and this is the only common format for many pairwise combinations of software that need to communicate with each other. The V2000 format cannot be retrofitted to allow more than 1000 atoms or bonds without rearranging the Fortran-style column structure of the format, which means that removing the limit requires an encoding method which is entirely incompatible with the previous level. This is the major value proposition of the V3000 Molfile format. Since small molecules almost never exceed this limit, and the format is significantly inconvenient to use, adoption has been haphazard. 

For software to be compatible with _OpenMolecule_ level 1.1, and make use of the Molfile format, it must be capable of reading and writing both the V2000 and V3000 variants. For other cheminformatics formats that do not impose this limit, there is no difference between 1.0 and 1.1.

## Level 1.2: inline abbreviations

A very common practice amongst chemists is to use abbreviation labels for groups of atoms, for example "Ph" is generally understood to encode for _phenyl_ (C6H5). A very common problem with chemical data formats is that these abbreviations are often entered directly into the datastructure as if they were elements, and it is presumed that parsing software will simply understand that these have generally agreed upon meanings. This situation is quite untenable, since beyond the very common labels (Ph, Me, Et, Pr, etc.), there is no universal list, and most research groups have their own local favourites. It is also not possible to guess when a non-element label refers to an abbreviation that refers to a specific fragment and a variable of some kind, such as "X" for "any halogen" or "R" for a Markush-style enumeration. Proposing a universal dictionary for abbreviations has some potential merit, but ultimately there will be too many clashes, and adding the burden of maintaining a dictionary of abbreviations to all compliant software is not viable.

For many classes of structures the simple solution to this problem is to refrain from using abbreviations. This is a very practical option for the largest use case for cheminformatics, namely evaluation of small organic molecules for drug discovery. However, the abbreviation style is _very_ popular amongst chemists when drawing chemical reactions, and eliminating this option for synthetic chemists is unrealistic. For a many (or most) inorganic and organometallic compounds, drawing structures that can be represented in a visually agreeable style is almost impossible without heavy use of abbreviations, since the inclusion of congested metal centres, large rings and exotic geometries imposes too much of a burden on an all-heavy-atom diagram.

The proper solution to the abbreviation problem is to mandate that the abbreviations are defined _within_ the molecular description, in a format that can be algorithmically converted to a representation that has all of the atoms, bonds and accompanying properties, while retaining the option to display it to the user in its condensed form.

This functionality can be achieved within some existing file formats, e.g. Molfile CTAB with its "S-group" definition, and SketchEl with its inline abbreviations. In order to be compliant with level 1.2, a datastructure must be able to parse, interpret and write a rigidly defined ability to define a _terminal_ abbreviation, whereby an "atom" is used as a representational placeholder, with its content further defined within.

... {TBD: details; how to use S-group; how it works with SketchEl}

## Level 1.3: zero order bonds and hydrogen counting

Most cheminformatics formats are designed to describe small molecules composed out of the ten most commonly encountered elements within biological systems, which causes two main problems when representing most inorganic/organic compounds, or organic molecules with unusual bonding arrangements:

* all bonds are classified as single, double or triple

* implicit hydrogens are always calculated, using a formula that is not explicitly defined because the answer is "obvious"

Representing bonds that are not easily defined as order 1, 2 or 3 can sometimes be accomplished by charge separation (e.g. representing a coordination bond as single, while increasing the charge of one atom, and reducing the charge of the other), but this is solution is problematic: it causes valence counting problems, can become quickly unintelligible, and does a very poor job of representing the chemistry.

There are many alternative solutions that are equally problematic in others ways; for example, allowing fractional bond orders; directional dative bonds; multi-centre bonds, etc. These solutions are appealing because they allow chemical ideas about the state of the electrons within the molecules to be asserted within the file format, but they induce various burdens. The most pertinent of these is that they tend to introduce an overinterpretation requirement on behalf of the chemist. For example, a coordination bond could be drawn as an arrow (dative style); as a hypervalent double bond; or a single bond with charge separation to indicate the direction. Chemists have reasons for using any of these styles, depending on their current understanding of the details of the bonding arrangement. While it is certainly useful to be able to capture this assertion in a digital format, it is more useful to have the lowest level cheminformatics representation expressed in the most minimalistic form possible, in a way that can be generally agreed upon, and processed in a uniform way by software. For this reason, the encoding of choice for non-ordinary bonds is to use the _zero order_ bond [see DOI:10.1021/ci200488k]. 

Implicit hydrogen counting is another problem that becomes serious when bond orders do not fit the simplistic 1/2/3 model. While it might be tempting to require that hydrogen atoms be explicitly drawn out, or their counts proactively marked as an atom property, the reality is that most molecular structures have organic moieties for which atomatic hydrogen counting rules can be applied, and that this is a drawing shortcut that is essential to the user interface for data creation. For example, a carbon atom with single bonds to two other atoms can safely be assumed to be -CH2- unless specified otherwise. By opting to _not_ assert that the carbon atom has 2 hydrogens within the format itself is that if the chemists loads the structure into an editor, and connects it to a third heavy atom by a single bond, the hydrogen count will be automatically decreased to 1. Removing this level of convenience would undoubtedly be an unsurmountable barrier to adoption.

Therefore, it is necessary to define a simple formula for calculating the number of _virtual_ hydrogens that are implied by the atom's environment, as well as a way to override that default whenever the situation differs from expected.

_OpenMolecule_ level 1.3 proposes two modifications that differ from most cheminformatics formats:

* bond orders must be whole numbers, i.e. 0, 1, 2, 3, 4, etc., where bonds of order 0 have no formal impact on an atom's valence (for basic low level cheminformatics book-keeping purposes such as calculation of implied hydrogens for molecular formula counting), while bonds of order 4 or higher are quite rare and exotic

* atoms have an additional hydrogen count property which defaults to _calculated_, but can also be a whole number, where 0 means that there are no _virtual_ hydrogens

... {TBD: advice on how to encode in Molfiles: the M__ extensions for backward compatibility; and how SketchEl does it}

## Level 1.4: forward compatible metadata

The main purpose of the _OpenMolecule_ specification is to define a _minimalistic_ format that can capture the bare minimum information needed to express a molecular structure, and to be able to perform basic manipulation (e.g. substructure/similarity comparisons, calculating molecular formula correctly, generating InChI strings, using as the basis for higher level interpretations, etc.), and to do this in a way that is a comfortable match for established content-creation tools, and easily renderable in a way that is familiar to chemists.

There are many reasons to encode additional information in a molecular structure that is not necessarily essential for interpreting the molecule in a broadly compatible way, but is nonetheless very useful for certain applications. Examples may include the ability to indicate which ring pathways are aromatic, or provide more interpretation about the meaning of an unusual bond type. Other use cases may include the application of atom typing rules for forcefields, which may need to be stored within the structure representation prior to conformational embedding, but are not necessarily germane to baseline cheminformatics functionality. Molecular structures could additionally be decorated with application-specific logic that goes beyond most common use cases, such as guidelines for enumerating Markush-style structures. Uses also include aesthetic tweaks, such as configurable colours or fonts for atoms or bonds.

For most file formats, the biggest problem with adding metadata is that when software parses the format, it does not know how to retain metadata that is not understood. For example, the MDL Molfile format allows additional fields to be added at the end of the atom and bond lists, typically with the "M__" prefix, but for the most part these extensions include indexes to atoms and bonds. This means that if an application which does not understand a particular extension reads the file and makes some changes (e.g. reordering the atoms), it is not known whether these metadata entries are still valid: in particular, indexes may refer to the wrong or nonexistent atoms or bonds. For this reason the only viable option is to strip out metadata that is not understood, or to reject the import.

This forward-compatibility problem can be resolved to a large extent by defining 5 different metadata cases:

* atom persistent: a property of an atom that should be preserved as the molecule is edited (e.g. forcefield type, user-asserted stereochemistry label, highlight colour)

* atom transient: a property of an atom that should be removed whenever the molecule is modified (e.g. calculated properties that are dependent on the molecule in its entirety, such as partial charges)

* bond persistent: a property that should be preserved as the molecule is edited (e.g. higher order stereochemistry, over/under drawing hints)

* bond transient: a property of a bond that should be removed whenever the molecule is modified

* molecule properties: metadata labels that apply to the molecule as a whole; these may not necessarily continue to be valid when a molecule is modified (e.g. nomenclature), but because they do not reference atoms or bonds, leaving them unchanged after editing does not break the fundamental properties of the molecule

... {TBD: how to do this with Molfiles and SketchEl}


