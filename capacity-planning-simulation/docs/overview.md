# Capacity Planning Simulation Library

This library allows to create a *System Model* and run *Simulations* with it.
A System Model is made up from components (i.e. representing services) wich have one or more interfaces (i.e. API Endpoints).
Interfaces can be connected which each other.
During a Simulation data is fed into designated entry-points of the model and propageted through the model.
There is support for using Monte-Carlo variations on the input data.

# Naming
* System Model: All Components, Interfaces and Connections
* Simulation: Run a System Model with a single set of Input Variables
* Component: The basic entity of a System Model
* Interface: Data flow connection points of a component
* Environment: Overarching Object that holds the System Model and orchestrates the Simulation
* Template: Refines a Generic Component with custom logic/parameters
* Input Variable
* Load:
* Breakdown


# Programmatically Setting Up a Model

A model is made up of components and interfaces. Each of them have name (and automatically generated IDs).
This is how to create the component *Comp1* and it's interface *C1If1*.

```javascript
let environment = CptEnvironment.get();

//  create the first component
let c1 = new CptMicroserviceComponent("Comp1");
// add an interface
c1.addInterface("C1If1");
// register with the environment to be found
environment.registerComponent(c1);
```
While we're at it we'll create another one and connect the interfaces together:

```javascript
// create another component
let c2 = new CptMicroserviceComponent("Comp2");
c2.addInterface("C2If1");
environment.registerComponent(c2);

// connect the inteface of component 1 and 2.
// data will flow from c1/if1 to c2/if1.
c1.connectInterface("C1If1", c2, "C2If1");
```



# Running a Simulation
## Create Input Variables

Before running a simulation input variables have to be created.

```javascript
let ivs: CptInputVariable[] = [];
let iv = new CptInputVariable();
iv.name = "i";
iv.unit = "tps";
iv.value = 500;
iv.deviation = 10;
ivs.push(iv);

```

These can be explicitly assigned to Interfaces:
```javascript
c2.assignInputVariable("C2If1", "B");
```

When using the CPT UI to create a System Model the assignment is done implictly by using the "Input Variable Template".


## Ingest and Run

```javascript
let results = runSim(ivs);
```



# Templates

Custom Templates enhance basic Components with fitting logic and parameters. Every part of the life-cylcle of a template can be modified.

Three different anotations can be used to expose the functionality of editable parameters to the user:

## Hooks
Hooks can be used to insert user supplied code into the logic of the component derived from the Template.

Definition in the template:
```javascript
@CptHook("load", "latency")
public hookAdjustLatency?: Function;
```

Calling the hook code in the template:
```javascript
latVal = this.hookAdjustLatency(i.load, latVal);
```

When creating a System Model the hook code can be added to a component as javscript-string:
```javascript
let hookCode = "if (load.val['tps'] < 700 ){ return latency; } " +
    "else{ return latency*2; } ";

c3.addHookCode("hookAdjustLatency", hookCode);
```

## Component Attributes
Component wide attributes can expose parameters of the internal logic of a component to the user.


Definition in the template:
```javascript
@CptAttribute()
public tpsPerPod?: number;
```

When creating a System Model the attributes can be directly assigned to a component:
```javascript
c2.tpsPerPod = 100;
```

## Interface Attributes
It's also possible to define per interface attributes.
```javascript
@CptIfAttribute()
public tpsPerInst?: number;
```

These are assigned through a helper function of the component:
```javascript
c2.setIfAttribute("C2If1", "tpsPerInst", 100);

```

