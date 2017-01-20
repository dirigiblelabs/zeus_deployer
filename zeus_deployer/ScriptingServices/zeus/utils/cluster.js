/* globals $ */
/* eslint-env node, dirigible */

var extensions = require('core/extensions');

const EXT_POINT_NAME_SETTINGS_PROVIDER = '/zeus/deployer/extension_points/clusterSettingsProvider';
const EXT_POINT_NAME_CLUSTER_APPLICATION_HOOKS = '/zeus/deployer/extension_points/clusterApplicationHooks';

exports.getSettings = function() {
	var clusterSettingsProvider = getClusterSettingsProviderExtension();
	return {
		'server': getClusterSettingsServer(clusterSettingsProvider),
		'token': getClusterSettingsToken(clusterSettingsProvider),
		'namespace': getClusterSettingsNamespace(clusterSettingsProvider)
	};
};

exports.afterCreateApplication = function(application) {
	var hooks = getClusterApplicationHooksExtensions();
	for (var i = 0 ; i < hooks.length; i ++) {
		if (hooks[i] && isFunction(hooks[i].afterCreateApplication)) {
			hooks[i].afterCreateApplication(application);
		}
	}
};

exports.afterDeleteApplication = function(application) {
	var hooks = getClusterApplicationHooksExtensions();
	for (var i = 0 ; i < hooks.length; i ++) {
		if (hooks[i] && isFunction(hooks[i].afterDeleteApplication)) {
			hooks[i].afterDeleteApplication(application);
		}
	}
};

function getClusterSettingsServer(clusterSettingsProvider) {
	return clusterSettingsProvider && isFunction(clusterSettingsProvider.getServer) ? clusterSettingsProvider.getServer() : null;
}

function getClusterSettingsToken(clusterSettingsProvider) {
	return clusterSettingsProvider && isFunction(clusterSettingsProvider.getToken) ? clusterSettingsProvider.getToken() : null;
}

function getClusterSettingsNamespace(clusterSettingsProvider) {
	return clusterSettingsProvider && isFunction(clusterSettingsProvider.getNamespace) ? clusterSettingsProvider.getNamespace() : null;
}

function getClusterSettingsProviderExtension() {
	var extensionNames = extensions.getExtensions(EXT_POINT_NAME_SETTINGS_PROVIDER);
	for (var i = 0; i < extensionNames.length; i ++) {
		var extension = extensions.getExtension(extensionNames[i], EXT_POINT_NAME_SETTINGS_PROVIDER);
		return require(extension.getLocation());
	}
	return null;
}

function getClusterApplicationHooksExtensions() {
	var hooks = [];
	var extensionNames = extensions.getExtensions(EXT_POINT_NAME_CLUSTER_APPLICATION_HOOKS);
	for (var i = 0; i < extensionNames.length; i ++) {
		var extension = extensions.getExtension(extensionNames[i], EXT_POINT_NAME_CLUSTER_APPLICATION_HOOKS);
		hooks.push(require(extension.getLocation()));
	}
	return hooks;
}
function isFunction(f) {
	return typeof f === 'function';
}
