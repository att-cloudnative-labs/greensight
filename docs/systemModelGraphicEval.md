# System Model Graphic Framework Evaluation
This documentation aims to examine the features of two possible graphic frameworks that 
could be used to replace the current implementation of the System Model diagram (which 
currently uses the 2d canvas library, Konva).

### NGX Graph
**pros**
* Provides ability to pan and zoom
* Has an angular wrapper to allow for easier integration with the Capacity Planning Tool
* Provides Automatic Layout

**cons**
* no built-in functionality for grouping nodes
* drag-to-create connections not provided

**initial integration attempt**
As NGX graph uses json objects to define nodes and links, it was easy to use our existing 
component json objects in NGX Graph. The visual properties of our components could be used to 
change a component's color, a connection lines thickness etc. Panning and zooming was
automatically set up. Challenges arose when trying to re-render the graph but if another day 
was spent working with this framework, it may not have long to implement.

### jsPlumb Community Edition
**pros**
* Provides ability to create connections by dragging from source node to target node

**cons**
* no wrapper in community edition
* Does not provides automatic layout
* no built in pan and zoom functionality in community edition

**initial integration attempt**
Without a wrapper, most of the time was spent trying to use the functions within the existing
code. Eventually, I was able to generate a hard-coded diagram with six nodes and various connections
between them. As the majority of effort was spend getting a diagram to appear, little time was 
left to try display our own components.

### Comparison of external frameworks to current implementation
| Current Version features| NGX Graph | JsPlumb (community edition)
| ------ | ------ | ------ | 
| connection creation on drag | no | yes|
| grouping of components | no| yes|
| changing of visual properties| yes| yes|
| drawing of different shapes | yes | yes|

### Estimation of story points to use external framework/current implementation
|  | Current Version | NGX Graph | JsPlumb (community edition)
| ------ | ------ | ------ | ------ | 
| external framework setup| n/a| 15 | 20
| pan and zoom | 10 | 1 | 5
| auto-routing | 20 | 2 | 6
| finishing up editor | 30 | 20| 20
| maintaining editor | 5 | 3 | 3
|**total points**| **65** | **41** |**54** |

### Summary 
Overall, both graphic frameworks provide more features out of the box than the current konva implementation.
As both of these frameworks are designed for flowchart building, choosing either of these would make
the editor functionality easier to maintain. Because jsPlumb community edition does not provide any angular
integration support, it may take more effort to integrate into CPT than NGX graph. 
