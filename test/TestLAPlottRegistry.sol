pragma solidity >=0.4.25 <0.6.0;

import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";
import "../contracts/LAPlottRegistry.sol";
import "../contracts/LAPlott.sol";


contract TestLAPlottRegistry {

  bytes32 wkbHash = bytes32("This is a Well Known Binary");

    string addr1 = "1, first street";
    string addr2 = "2, second street";
    string label1 = "I'm a plott";
    string label2 = "I'm plott 2";
    string landUseCode1 = "Building";
    string landUseCode2 = "Agriculture";

    bytes15 dggsIndex2 = bytes15("8f28347ad921c65");
    bytes15 dggsIndex1 = bytes15("8f283470d921c65");
    uint area = 20;

    LAPlott.CadastralTypeCode cadastralType1 = LAPlott.CadastralTypeCode.PARCEL;
    LAPlott.CadastralTypeCode cadastralType2 = LAPlott.CadastralTypeCode.BUILDING;

  function testH3ValueUsingDeployedContract() public {
    LAPlottRegistry meta = LAPlottRegistry(DeployedAddresses.LAPlottRegistry());

    Assert.equal(meta.h3Resolution(), uint(15), "H3 Resolution in not 15");
  }

  function testAddedPlottValuesUsingDeployedContract() public {

    LAPlottRegistry meta = LAPlottRegistry(DeployedAddresses.LAPlottRegistry());

    bytes32 csc1 = meta.claimPlott(dggsIndex1, wkbHash, addr1, label1, area, landUseCode1, cadastralType1);
    bytes32 csc2 = meta.claimPlott(dggsIndex2, wkbHash, addr2, label2, area, landUseCode2, cadastralType2);

    Assert.notEqual(csc1, csc2, "The two CSCs shouldn't be equal");

    Assert.equal(meta.getFeatureCount(), uint(2), "The plotts count should be 2");

    LAPlott plott1 = LAPlott(meta.getFeature(csc1));
    LAPlott plott2 = LAPlott(meta.getFeature(csc2));
    bytes32 csc;
    string memory lbl;
    string memory addr;
    string memory landUse;
    uint ar;
    LAPlott.CadastralTypeCode cadastralType;

    (csc, lbl, addr, landUse, ar, cadastralType) = plott1.fetchPlott();

    Assert.equal(lbl, label1, "The plott label should be : I'm a plott");
    Assert.equal(addr, addr1, "The plott address should be : 1, first street");
    Assert.equal(landUse, landUseCode1, "The plott tyep should be : Building");
    Assert.equal(ar, area, "The plott area should be : 20");

    (csc, lbl, addr, landUse, ar, cadastralType) = plott2.fetchPlott();

    Assert.equal(lbl, label2, "The plott label should be : I'm plott 2");
    Assert.equal(addr, addr2, "The plott address should be : 2, second street");
    Assert.equal(landUse, landUseCode2, "The plott tyep should be : Agriculture");
    Assert.equal(ar, area, "The plott area should be : 20");

  }
}
