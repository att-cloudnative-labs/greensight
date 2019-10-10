# 12871
Design task for auto-populating the list of available components and properties from the simulation templates

# Goal
Make the modelling UI component completely generic so that no components, component properties or component interface properties are hardcoded in the UI. The UI should look the same as is does now. Once the groundwork has been completed to make the UI generic, no additional work should be required on the UI if additional templates are added to the simulation code.

# Process
The simulation code will need a function that will gather all template objects. An additional function may be needed to extract the relevant data from the templates and transpose it into a json object that the UI can consume. There are existing functions in the cpt-object to list template attributes and interface attributes.

There will need to be a way of identifing how these attribute will be displayed in the UI. This could be achieved by adding in the display type and the values as parameters in the attribute annotation. A range of values can also be provided as a parameter, restricting the user input to a specific set of values. The first value will by default be the placeholder value on the UI in either the input field or the dropdown. Both the default values and the range of value restiction are optional parameters.

@CptAttribute("input", "20", "0 < x < 100")

@CptAttribute("dropdown", "value1, value2, value3")

The parameters of the CPTAttribute will be parsed within the CPTAttribute function.

Another approach could be to create multiple attribute types for each specific type of attribute:

@CptNumericAttribute
@CptStringAttribute
@CptDropdownAttribute

The simulation code will have a getTemplates() function that will return the json array of templates and template/interface attributes.

The image name for each of the templates will also need to be within the contents of the GET templates JSON response. This image name should be a value on each of the templates. The images will be stored within the frontend code as they currently are and will be dynamically referenced using the image name retrieved from the JSON response.

The connection properties will also be available within the template structure, with a micro-service template having connection properties for sequence number, multiplier and probability as an example. Other templates may have a different set of connection properties.

The list of templates can be exposed to the UI through an API call GET templates.


# Possible JSON response
```
{
	"templates": [
		{
			"displayName": "micro-service",
			"id": "1000",
			"classId": "1100",
			"image": "java_ms",
			"attributes": [
				{
					"attributeId": "tpsPerPod",
					"displayType": "input",
					"values": "1",
					"range": "0 < x"
				},
				{
					"attributeId": "version",
					"displayType": "input"
					"values": "",
					"range": "0 < x"
				},
				{
					"attributeId": "location",
					"displayType": "dropdown",
					"values": ["North", "East", "South", "West"],
					"range": ""					
				}
			],
			"ifAttributes": [
				{
					"attributeId": "internalLatency",
					"displayType": "input"
					"values": "1",
					"range": "0 < x < 100"
				},
				{
					"attributeId": "distribution",
					"displayType": "dropdown",
					"values": ["None", "Gaussian"],
					"range": ""	
				}
			],
			"downstreamInterfaceAttributes": [
				{
					"attributeId": "sequence#",
					"value": "-1"
				},
				{
					"attributeId": "multiplier",
					"value": "1"
				},
				{
					"attributeId": "probability",
					"value": "1"
				}
			]
		},
		{
			"displayName": "av-service",
			"id": "2000",
			"classId": "2100",
			"image": "av_ms",
			"attributes": [
				{
					"attributeId": "avType",
					"displayType": "dropdown",
					"values": ["Push", "Pull"],
					"range": ""	
				},
				{
					"attributeId": "noOfChannels",
					"displayType": "input",
					"values": "1",
					"range": "0 < x < 70"
				}
			],
			"ifAttributes": [
				{
					"attributeId": "name",
					"displayType": "input"
					"values": "",
					"range": ""
				}
			]
		}
	]
}
```
