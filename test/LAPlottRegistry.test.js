

let catchRevert = require("./exceptionHelpers").catchRevert
const truffleAssert = require('truffle-assertions');
var LAPlottRegistry = artifacts.require("./LAPlottRegistry.sol")
var LAPlott = artifacts.require("./LAPlott.sol")

contract('LAPlottRegistry', function (accounts) {

  const owner = accounts[0]
  const alice = accounts[1]
  const bob = accounts[2]

  const h3Resolution = 15;
  const plottRegistryName = "TestPlottRegistry";
  const srs = "EPSG:6666";

  const dggsIndex1 = web3.utils.toHex("8f283470d921c65"); // must be 15 bytes
  const dggsIndex2 = web3.utils.toHex("8f28347ad921c65");

  const wkbHash = web3.utils.soliditySha3('This is a Well Known Binary');
  const addr1 = "1, first street";
  const addr2 = "2, second street";
  const label1 = "I'm a plott";
  const label2 = "I'm plott 2";
  const area = 20;
  const landUseCode1 = "Building";
  const landUseCode2 = "Agriculture";

  const CADASTRAL_TYPE_PARCEL = 0;
  const CADASTRAL_TYPE_BUILDING = 1;

  const cadastralType1 = CADASTRAL_TYPE_PARCEL;
  const cadastralType2 = CADASTRAL_TYPE_BUILDING;


  beforeEach(async () => {
    instance = await LAPlottRegistry.new(plottRegistryName, h3Resolution, srs);
  })


  it("Should return the correct initial values of the state variables", async () => {
    let registryName = "Plott Registry"
    let returnedName = await instance.name();
    let returnedH3Res = await instance.h3Resolution();
    let returnedSrs = await instance.srs();

    assert.equal(returnedName, registryName, "The plott name should be " + plottRegistryName);
    assert.equal(returnedH3Res, h3Resolution, "The resolution should be " + h3Resolution);
    assert.equal(returnedSrs, srs, "The SRS should be " + srs);
  });


  it("Should log an avent with the correct CSC when a new Feature is added", async () => {
    const index = web3.utils.soliditySha3({ type: 'address', value: owner },
                                          { type: 'bytes15', value: dggsIndex1 });

    const result = await instance.claimPlott(dggsIndex1, wkbHash, addr1, label1, area, landUseCode1, cadastralType1);

    const expectedEventResult = { csc: index };

    const logAddFeature = result.logs[3].args.csc;

    assert.equal(expectedEventResult.csc, logAddFeature, "LogAddFeature event not emitted with the correct CSC, check ClaimPlott method");
  });

  it("Should emit a LogPlottClaimed event when a Plott is Claimed", async () => {
    let eventEmitted = false
    const tx = await instance.claimPlott(dggsIndex1, wkbHash, addr1, label1, area, landUseCode1, cadastralType1);

    if (tx.logs[2].event == "LogPlottClaimed") {
      eventEmitted = true;
    }

    assert.equal(eventEmitted, true, 'Claiming a plott should emit a LogPlottClaimed event')
  });

  it("Shouldn't allow adding new plott with the an existing dggsIndex", async () => {
    // The registry shouldn't allow two plotts with the same dggsIndex
    await instance.claimPlott(dggsIndex1, wkbHash, addr1, label1, area, landUseCode1, cadastralType1);
    await truffleAssert.fails(instance.claimPlott(dggsIndex1, wkbHash, addr2, label2, area, landUseCode2, cadastralType1),
      truffleAssert.ErrorType.REVERT);
  });

  it("Should set the correct values for the new claimed plott", async () => {
    const result1 = await instance.claimPlott(dggsIndex1, wkbHash, addr1, label1, area, landUseCode1, cadastralType1);
    const result2 = await instance.claimPlott(dggsIndex2, wkbHash, addr2, label2, area, landUseCode2, cadastralType2);

    const count = await instance.getFeatureCount();
    assert.equal(count, 2, "The plotts count should be 2");

    const csc1 = result1.logs[2].args.csc;
    const csc2 = result2.logs[2].args.csc;

    assert.notEqual(csc1, csc2, "The two CSCs shouldn't be equal");

    const feature1Address = await instance.getFeature(csc1);
    const feature2Address = await instance.getFeature(csc2);

    const plott1 = await LAPlott.at(feature1Address);
    const plott2 = await LAPlott.at(feature2Address);
    var plott1Values = await plott1.fetchPlott();
    var plott2Values = await plott2.fetchPlott();

    assert.equal(plott1Values[1], label1, "The plott label should be : " + label1);
    assert.equal(plott1Values[2], addr1, "The plott address should be : " + addr1);
    assert.equal(plott1Values[3], landUseCode1, "The plott type should be : " + landUseCode1);
    assert.equal(plott1Values[4], area, "The plott area should be :" + area);
    assert.equal(plott1Values[5], cadastralType1, "The plott cadastral Type should be :" + cadastralType1);

    assert.equal(plott2Values[1], label2, "The plott label should be : " + label2);
    assert.equal(plott2Values[2], addr2, "The plott address should be : " + addr2);
    assert.equal(plott2Values[3], landUseCode2, "The plott label should be : " + landUseCode2);
    assert.equal(plott2Values[4], area, "The plott area should be :" + area);
    assert.equal(plott2Values[5], cadastralType2, "The plott cadastral Type should be :" + cadastralType2);
  });

  it("Should returns true if dggsIndex exist in the registry", async () => {
    await instance.claimPlott(dggsIndex1, wkbHash, addr1, label1, area, landUseCode1, cadastralType1);
    assert.equal(await instance.dggsIndexExist(dggsIndex1), true, "False returned for an existing dggsIndex");
  });

  it("Should returns the correct address of the dggsIndex owner", async () => {
    await instance.claimPlott(dggsIndex1, wkbHash, addr1, label1, area, landUseCode1, cadastralType1, { from: alice });
    assert.equal(await instance.dggsIndexOwner(dggsIndex1), alice, "Returned address do not correspond to the dggsIndex owner");

    await instance.claimPlott(dggsIndex2, wkbHash, addr1, label1, area, landUseCode1, cadastralType1, { from: bob });
    assert.equal(await instance.dggsIndexOwner(dggsIndex2), bob, "Returned address do not correspond to the dggsIndex owner");
  });

  it("Should returns the owner of the plott", async () => {
    const result = await instance.claimPlott(dggsIndex1, wkbHash, addr1, label1, area, landUseCode1, cadastralType1, { from: alice });

    const csc = result.logs[2].args.csc;

    const featureAddress = await instance.getFeature(csc);
    const plott = await LAPlott.at(featureAddress);
    var plottValues = await plott.fetchFeature();

    assert.equal(plottValues[3], alice, "The returned value do not correspond to the owner");
  });

  it("Should revert if the caller is not an Admin", async () => {
    const result = await instance.claimPlott(dggsIndex1, wkbHash, addr1, label1, area, landUseCode1, cadastralType1, { from: alice });

    const csc = result.logs[2].args.csc;

    const featureAddress = await instance.getFeature(csc);
    const plott = await LAPlott.at(featureAddress);

    await truffleAssert.passes(plott.setWkbHash(wkbHash, { from: alice }), truffleAssert.ErrorType.REVERT);
    await truffleAssert.fails(plott.setWkbHash(wkbHash, { from: bob }), truffleAssert.ErrorType.REVERT);
    await truffleAssert.passes(plott.setExtAddress(addr2, { from: alice }), truffleAssert.ErrorType.REVERT);
    await truffleAssert.fails(plott.setExtAddress(addr2, { from: bob }), truffleAssert.ErrorType.REVERT);
    await truffleAssert.passes(plott.setLabel(label2, { from: alice }), truffleAssert.ErrorType.REVERT);
    await truffleAssert.fails(plott.setLabel(label2, { from: bob }), truffleAssert.ErrorType.REVERT);
    await truffleAssert.passes(plott.setArea(area, { from: alice }), truffleAssert.ErrorType.REVERT);
    await truffleAssert.fails(plott.setArea(area, { from: bob }), truffleAssert.ErrorType.REVERT);
    await truffleAssert.passes(plott.setLandUseCode(landUseCode2, { from: alice }), truffleAssert.ErrorType.REVERT);
    await truffleAssert.fails(plott.setLandUseCode(landUseCode2, { from: bob }), truffleAssert.ErrorType.REVERT);

  });

  it("Should allow killing a feature by admins and log LogFeatureKilled", async () => {
    const result = await instance.claimPlott(dggsIndex1, wkbHash, addr1, label1, area, landUseCode1, cadastralType1,  { from: alice });

    const csc = result.logs[2].args.csc;

    const featureAddress = await instance.getFeature(csc);

    await truffleAssert.passes(LAPlott.at(featureAddress));

    await truffleAssert.fails(instance.removeFeature(csc, { from: bob }));

    const tx = await instance.removeFeature(csc, { from: alice }); // may test for owner too

    let eventEmitted = false
    if (tx.logs[0].event == "LogFeatureRemoved") {
      eventEmitted = true
    }

    assert.equal(eventEmitted, true, 'Removing a feature should emit a LogFeatureRemoved event')

   
    await truffleAssert.fails(LAPlott.at(featureAddress));

  });

});