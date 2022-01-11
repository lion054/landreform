pragma solidity ^0.5.0;

import './LAPlott.sol';
import './geospatial/CSFeatureRegistry.sol';

contract LAPlottRegistry is CSFeatureRegistry {
  //
  // State variables
  //

  // mapping(bytes32 => LAPlott) plotts; // Mapping CSC => Plotts

  //
  // Events - publicize actions to external listeners
  //

  event LogPlottClaimed(bytes32 indexed csc, bytes15 indexed dggsIndex, bytes32 wkbHash,
                          string addr, string lbl, uint area, string plottType, address owner);

  //
  // Functions
  //

  /// @notice constuctor
  constructor (string memory _name, uint _h3Resolution, string memory _srs) public
  CSFeatureRegistry(_name,_h3Resolution,_srs) {
    name = "Plott Registry";
  }

  /**
  * @notice addFeature modifier
  * @param dggsIndex dggsIndex of the feature
  * @param wkbHash Well Known Binary Hash
  * @param extAddr External Address
  * @param label Plott label
  * @param area Plott Area
  * @param landUseCode land use code
  * @param cadastralType cadastral type (plott / building)
  * @return the Crypto-Spatial Coordinate (CSC) of the feature
  */
  function claimPlott(bytes15 dggsIndex,
                       bytes32 wkbHash,
                       string memory extAddr,
                       string memory label,
                       uint area,
                       string memory landUseCode,
                       LAPlott.CadastralTypeCode cadastralType)
      public addFeature( dggsIndex, wkbHash, msg.sender)
      returns (bytes32) {

    // TODO check inputs

    LAPlott plott = new LAPlott(dggsIndex,wkbHash, msg.sender, h3Resolution);
    bytes32 csc = plott.getFeatureCSC();
    features[csc] = address(plott);
    plott.setPlottValues(label, extAddr, landUseCode, area, cadastralType);
    emit LogPlottClaimed(csc, dggsIndex, wkbHash, extAddr, label, area, landUseCode, msg.sender);
    return csc;
  }
}
