const LAPlottRegistry = artifacts.require("./LAPlottRegistry");
const CSGeometryLib = artifacts.require("./geospatial/CSGeometryLib");

module.exports = function(deployer) {
  deployer.deploy(CSGeometryLib);
  deployer.link(CSGeometryLib, LAPlottRegistry);
  const h3Resolution = 15;
  const plottRegistryName = "PlottRegistry"
  const srs = "EPSG:3857" // WGS 84 / Pseudo-Mercator
  deployer.deploy(LAPlottRegistry, plottRegistryName, h3Resolution, srs);
};
