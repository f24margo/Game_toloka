import LLM "mo:llm";

persistent actor {
  
  public func checkAnswer(word: Text, answer: Text, roundType: Text) : async Text {
    let prompt = "Ukrainian language task. Word: '" # word # "'. Player answered: '" # answer # "'. Task type: " # roundType # ". Is the answer correct? Reply only: YES or NO.";
    await LLM.prompt(#Llama3_1_8B, prompt)
  };

  public func getWord(topic: Text) : async Text {
    let prompt = "Give me one random Ukrainian word related to topic: " # topic # ". Reply with only the word, nothing else.";
    await LLM.prompt(#Llama3_1_8B, prompt)
  };

};
