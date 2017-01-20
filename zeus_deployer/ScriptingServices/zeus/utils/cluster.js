/* globals $ */
/* eslint-env node, dirigible */

var extensions = require('core/extensions');

const EXT_POINT_NAME = '/zeus/deployer/extension_points/clusterSettingsProvider';

exports.getSettings = function() {
	var clusterSettingsProvider = getClusterSettingsProviderExtension();
	return {
		'server': getClusterSettingsServer(clusterSettingsProvider),
		'token': getClusterSettingsToken(clusterSettingsProvider),
		'namespace': getClusterSettingsNamespace(clusterSettingsProvider)
	};
};

function getClusterSettingsProviderExtension() {
	var extensionNames = extensions.getExtensions(EXT_POINT_NAME);
	for (var i = 0; i < extensionNames.length; i ++) {
		var extension = extensions.getExtension(extensionNames[i], EXT_POINT_NAME);
		return require(extension.getLocation());
	}
	return null;
}

function getClusterSettingsServer(clusterSettingsProvider) {
	return clusterSettingsProvider && isFunction(clusterSettingsProvider.getServer) ? clusterSettingsProvider.getServer() : null;
}

function getClusterSettingsToken(clusterSettingsProvider) {
	return clusterSettingsProvider && isFunction(clusterSettingsProvider.getToken) ? clusterSettingsProvider.getToken() : null;
}

function getClusterSettingsNamespace(clusterSettingsProvider) {
	return clusterSettingsProvider && isFunction(clusterSettingsProvider.getNamespace) ? clusterSettingsProvider.getNamespace() : null;
}

function isFunction(f) {
	return typeof f === 'function';
}