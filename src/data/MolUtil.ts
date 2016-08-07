/*
    MolSync

    (c) 2010-2016 Molecular Materials Informatics, Inc.

    All rights reserved
    
    http://molmatinf.com

	[PKG=molsync]
*/

/*
	MolUtil: static methods for calculating molecule properties.
*/

class MolUtil
{
    public static TEMPLATE_ATTACHMENT = "X";
    public static ABBREV_ATTACHMENT = "*";
    
    public static isBlank(mol:Molecule):boolean
    {
        return mol == null || mol.numAtoms() == 0;
    }
    public static notBlank(mol:Molecule):boolean
    {
        return mol != null || mol.numAtoms() > 0;
    }
}