/* globals $ */
/* eslint-env node, dirigible */

var request = require('net/http/request');
var response = require('net/http/response');
var xss = require('utils/xss');

var templates = require('zeus/templates/utils/templates');
var generator = require('zeus/templates/utils/generator');
var cluster = require('zeus/utils/cluster');

var kubernetesDeployments = require('kubernetes/deployments');
var kubernetesServices = require('kubernetes/services');


var clusterSettings = cluster.getSettings();
var server = clusterSettings.server;
var namespace = clusterSettings.namespace;
var token = clusterSettings.token;

try {
    var applicationTemplateId = xss.escapeSql(request.getParameter('applicationTemplateId'));
    var applicationName = xss.escapeSql(request.getParameter('applicationName'));

    var applicationTemplate = templates.getApplicationTemplate(applicationTemplateId);
    var generatedBody = generator.generate(applicationName, applicationTemplate, namespace); 
    for (var i = 0; i < generatedBody.deployments.length; i ++) {
        var deploymentBody = generatedBody.deployments[i];
        var deploymentResponse = kubernetesDeployments.create(server, token, namespace, deploymentBody);
        console.log(JSON.stringify(deploymentResponse));
    }
    for (var i = 0; i < generatedBody.services.length; i ++) {
        var serviceBody = generatedBody.services[i];
        var serviceResponse = kubernetesServices.create(server, token, namespace, serviceBody);
        console.log(JSON.stringify(serviceResponse));
    }
    response.println('Ok');
} catch (e) {
    response.println(e);
}

response.flush();
response.close();
