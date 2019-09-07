// This sample demonstrates handling intents from an Alexa skill using the Alexa Skills Kit SDK (v2).
// Please visit https://alexa.design/cookbook for additional examples on implementing slots, dialog management,
// session persistence, api calls, and more.
const Alexa = require("ask-sdk-core");
const persistenceAdapter = require("ask-sdk-s3-persistence-adapter");

// the first time the skill is opened 
const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === "LaunchRequest";
  },
  handle(handlerInput) {
    const speechText = "Hello! I'm here to help you remember when you last fed your pet!  What is your pets name?";
    const repromptText =
      "My doggo's name is Zeus. He's a good boy. What's your pets name?";
    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(repromptText)
      .getResponse();
  }
};


// if the user has already opened the skill and saved their pet's name
const HasPetNameLaunchRequestHandler = {
  canHandle(handlerInput) {
    const attributesManager = handlerInput.attributesManager;
    const sessionAttributes = attributesManager.getSessionAttributes() || {};
    const name = sessionAttributes.name;

    return (
      handlerInput.requestEnvelope.request.type === "LaunchRequest" && name
    );
  },
  handle(handlerInput) {
    const serviceClientFactory = handlerInput.serviceClientFactory;
    const deviceId =
      handlerInput.requestEnvelope.context.System.device.deviceId;
    const attributesManager = handlerInput.attributesManager;
    const sessionAttributes = attributesManager.getSessionAttributes() || {};

    const name = sessionAttributes.hasOwnProperty("name") ? sessionAttributes.name : 0;
    const fedTime = sessionAttributes.hasOwnProperty("fedTime") ? sessionAttributes.fedTime : 0;
    const fedDate = sessionAttributes.hasOwnProperty("fedDate") ? sessionAttributes.fedDate : 0;

    // TODO:: Use the settings API to get current time and compute how long ago the pet was fed last
    
    let speechText = `${name} is a good boy today!`;
    let appendDate
    let appendTime
    const today = new Date().getDay()
    
    if (fedDate !== 0) {
        if (today - fedDate === 0) {
            appendDate = 'today';
        } else if (today - fedDate === 1 || today - fedDate === -6) {
            appendDate = 'yesterday';
        } else {
            switch (fedDate) {
                case 0:
                    appendDate = 'Sunday';
                    break;
                case 1:
                    appendDate = 'Monday';
                    break;
                case 2:
                    appendDate = 'Tuesday';
                    break;
                case 3:
                    appendDate = 'Wednesday';
                    break;
                case 4:
                    appendDate = 'Thursday';
                    break;
                case 5:
                    appendDate = 'Friday';
                    break;
                case 6:
                    appendDate = 'Saturday';
                    break;
            }
        }
    }
    
    if (fedTime !== 0) {
        switch (fedTime) {
            case 'MO':
                appendTime = 'in the morning';
                break;
            case 'AF':
                appendTime = 'in the afternoon';
                break;
            case 'EV':
                appendTime = 'in the evening';
                break;
            case 'NI':
                appendTime = 'at night';
                break;
            default:
                appendTime = `at ${fedTime}`
        }
        speechText = speechText + `${name} was last fed ` + appendTime;
    }

    return handlerInput.responseBuilder
      .speak(speechText)
      .getResponse();
  }
};




// only happens if the intent request is a capture petname intent and if no pet name is saved in the session attributes
const CapturePetNameIntentHandler = {
  canHandle(handlerInput) {
    const attributesManager = handlerInput.attributesManager;
    const sessionAttributes = attributesManager.getSessionAttributes() || {};
    const name = sessionAttributes.hasOwnProperty("name") ? sessionAttributes.name : null;
    
    return (
      handlerInput.requestEnvelope.request.type === "IntentRequest" &&
      handlerInput.requestEnvelope.request.intent.name === "CapturePetNameIntent" && name === null
    );
  },
  async handle(handlerInput) {
    const name = handlerInput.requestEnvelope.request.intent.slots.name.value;
    const attributesManager = handlerInput.attributesManager;
    const petAttributes = { name: name };

    attributesManager.setPersistentAttributes(petAttributes);
    await attributesManager.savePersistentAttributes();

    const speechText = `Thanks, I'll remember ${name}'s name.  When was the last time you fed ${name}?`;
    const repromptText = `When was the last time you fed ${name}? You can say this morning, 8am, or now.`;
    return handlerInput.responseBuilder
        .speak(speechText)
        .reprompt(repromptText)
        .getResponse();
  }
};


// acknowledge that the user told alexa when pet was last fed and confirm time back to user
const CaptureLastFedIntentHandler = {
  canHandle(handlerInput) {
    const attributesManager = handlerInput.attributesManager;
    const sessionAttributes = attributesManager.getSessionAttributes() || {};
    const name = sessionAttributes.name;
    
    return (
      handlerInput.requestEnvelope.request.type === "IntentRequest" &&
      handlerInput.requestEnvelope.request.intent.name === "CaptureLastFedIntent" && 
      name !== null
    );
  },
  async handle(handlerInput) {
    const attributesManager = handlerInput.attributesManager;
    const sessionAttributes = attributesManager.getSessionAttributes();
    const name = sessionAttributes.name;
    const fedTime = handlerInput.requestEnvelope.request.intent.slots.time.value;
    // const fedDate = handlerInput.requestEnvelope.request.intent.slots.day.value;
    // const fedDuration = handlerInput.requestEnvelope.request.intent.slots.duration.value;

    const petAttributes = {
      name: name,
      fedTime: fedTime
    //   fedDate: fedDate
    }

    attributesManager.setPersistentAttributes(petAttributes);
    await attributesManager.savePersistentAttributes();

    let speechText = `Great! I'll remember ${name} was last fed `;
    let appendText
    
    switch (fedTime) {
        case 'MO':
            appendText = 'in the morning';
            break;
        case 'AF':
            appendText = 'in the afternoon';
            break;
        case 'EV':
            appendText = 'in the evening';
            break;
        case 'NI':
            appendText = 'at night';
            break;
        default:
            appendText = `at ${fedTime}`
    }
    
    speechText = speechText + appendText;
    
    return handlerInput.responseBuilder
        .speak(speechText)
        .getResponse();
  }
}













const HelpIntentHandler = {
  canHandle(handlerInput) {
    return (
      handlerInput.requestEnvelope.request.type === "IntentRequest" &&
      handlerInput.requestEnvelope.request.intent.name === "AMAZON.HelpIntent"
    );
  },
  handle(handlerInput) {
    const speechText = "You can say hello to me! How can I help?";

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .getResponse();
  }
};
const CancelAndStopIntentHandler = {
  canHandle(handlerInput) {
    return (
      handlerInput.requestEnvelope.request.type === "IntentRequest" &&
      (handlerInput.requestEnvelope.request.intent.name ===
        "AMAZON.CancelIntent" ||
        handlerInput.requestEnvelope.request.intent.name ===
        "AMAZON.StopIntent")
    );
  },
  handle(handlerInput) {
    const speechText = "Goodbye!";
    return handlerInput.responseBuilder.speak(speechText).getResponse();
  }
};
const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === "SessionEndedRequest";
  },
  handle(handlerInput) {
    // Any cleanup logic goes here.
    return handlerInput.responseBuilder.getResponse();
  }
};

// The intent reflector is used for interaction model testing and debugging.
// It will simply repeat the intent the user said. You can create custom handlers
// for your intents by defining them above, then also adding them to the request
// handler chain below.
const IntentReflectorHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === "IntentRequest";
  },
  handle(handlerInput) {
    const intentName = handlerInput.requestEnvelope.request.intent.name;
    const speechText = `You just triggered ${intentName}`;

    return (
      handlerInput.responseBuilder
        .speak(speechText)
        //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
        .getResponse()
    );
  }
};

// Generic error handling to capture any syntax or routing errors. If you receive an error
// stating the request handler chain is not found, you have not implemented a handler for
// the intent being invoked or included it in the skill builder below.
const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log(`~~~~ Error handled: ${error.message}`);
    const speechText = `Sorry, I couldn't understand what you said. Please try again.`;

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .getResponse();
  }
};

// Adding an interceptor to intercept the request to read birthday information stored in Amazon S3
const LoadPetNameInterceptor = {
  async process(handlerInput) {
    const attributesManager = handlerInput.attributesManager;
    const sessionAttributes =
      (await attributesManager.getPersistentAttributes()) || {};

    const name = sessionAttributes.hasOwnProperty("name")
      ? sessionAttributes.name
      : 0;

    if (name) {
      attributesManager.setSessionAttributes(sessionAttributes);
    }
  }
};

// This handler acts as the entry point for your skill, routing all request and response
// payloads to the handlers above. Make sure any new handlers or interceptors you've
// defined are included below. The order matters - they're processed top to bottom.
exports.handler = Alexa.SkillBuilders.custom()
  .withApiClient(new Alexa.DefaultApiClient())
  .withPersistenceAdapter(
    new persistenceAdapter.S3PersistenceAdapter({
      bucketName: process.env.S3_PERSISTENCE_BUCKET
    })
  )
  .addRequestHandlers(
    HasPetNameLaunchRequestHandler,
    LaunchRequestHandler,
    CapturePetNameIntentHandler,
    CaptureLastFedIntentHandler,
    HelpIntentHandler,
    CancelAndStopIntentHandler,
    SessionEndedRequestHandler,
    IntentReflectorHandler
  ) // make sure IntentReflectorHandler is last so it doesn't override your custom intent handlers
  .addRequestInterceptors(LoadPetNameInterceptor)
  .addErrorHandlers(ErrorHandler)
  .lambda();
