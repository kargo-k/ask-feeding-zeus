// This sample demonstrates handling intents from an Alexa skill using the Alexa Skills Kit SDK (v2).
// Please visit https://alexa.design/cookbook for additional examples on implementing slots, dialog management,
// session persistence, api calls, and more.
const Alexa = require("ask-sdk-core");
const persistenceAdapter = require("ask-sdk-s3-persistence-adapter");

const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === "LaunchRequest";
  },
  handle(handlerInput) {
    const speechText = "Hello! What is your pets name?";
    const repromptText =
      "My pets name is Zeus. He's a good boy. What's your pets name?";
    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(repromptText)
      .getResponse();
  }
};

const HasPetNameLaunchRequestHandler = {
  canHandle(handlerInput) {
    const attributesManager = handlerInput.attributesManager;
    const sessionAttributes = attributesManager.getSessionAttributes() || {};

    const name = sessionAttributes.hasOwnProperty("name")
      ? sessionAttributes.name
      : 0;

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

    const name = sessionAttributes.hasOwnProperty("name")
      ? sessionAttributes.name
      : 0;

    // TODO:: Use the settings API to get current date and then compute how many days until user's birthday
    // TODO:: Say Happy birthday on the user's birthday

    const speechText = `Welcome back. It looks like there are X more days until your y-th birthday.`;

    return handlerInput.responseBuilder.speak(speechText).getResponse();
  }
};

// acknowledge that the user provided their pet name and repeat the pet name back to the user
const CapturePetNameIntentHandler = {
  canHandle(handlerInput) {
    return (
      handlerInput.requestEnvelope.request.type === "IntentRequest" &&
      handlerInput.requestEnvelope.request.intent.name ===
        "CapturePetNameIntent"
    );
  },
  async handle(handlerInput) {
    // async makes the code asynchronous, so that the skill can keep running while the data is processed and saved
    const name = handlerInput.requestEnvelope.request.intent.slots.name.value;

    const attributesManager = handlerInput.attributesManager;

    const petAttributes = { name: name };

    attributesManager.setPersistentAttributes(petAttributes);
    await attributesManager.savePersistentAttributes();

    const speechText = `Thanks, I'll remember ${name}'s name.`;
    return (
      handlerInput.responseBuilder
        .speak(speechText)
        //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
        .getResponse()
    );
  }
};
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
    HelpIntentHandler,
    CancelAndStopIntentHandler,
    SessionEndedRequestHandler,
    IntentReflectorHandler
  ) // make sure IntentReflectorHandler is last so it doesn't override your custom intent handlers
  .addRequestInterceptors(LoadPetNameInterceptor)
  .addErrorHandlers(ErrorHandler)
  .lambda();
