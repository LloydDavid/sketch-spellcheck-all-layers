@import 'sketch-nibui.js';

function onRun(context) {
  var sketch = context.api();
  var doc = context.document;

  var documentTag = [[NSSpellChecker sharedSpellChecker] uniqueSpellDocumentTag]

  // Filter layers using NSPredicate
	var scope = (typeof containerLayer !== 'undefined') ? [containerLayer children] : [[doc currentPage] children],
		predicate = NSPredicate.predicateWithFormat("(className == %@)", "MSTextLayer"),
		layers = [scope filteredArrayUsingPredicate:predicate];

	// Deselect current selection
	[[doc currentPage] deselectAllLayers]

	// Loop through filtered layers and select them
	var loop = [layers objectEnumerator], layer;
  var allWords = "";
  var misspellingcount = 0;
  var stopChecking = false;
  while (layer = [loop nextObject] &! stopChecking) {
    //do spellcheck on each layer
        var aString = [layer stringValue]
        range = [[NSSpellChecker sharedSpellChecker] checkSpellingOfString:aString startingAt:0];
        if(range.length >0){
          //Select the layer
          //[layer select:true byExpandingSelection:true]
          [layer select:true byExpandingSelection:false]

          var misSpelledWord = aString.substring(range.location, (range.location+range.length))
          allWords = allWords+"\nText: "+aString+"\nMisspelled Word: "+misSpelledWord+"\n";
          misspellingcount ++;
          var guesses = [[NSSpellChecker sharedSpellChecker] guessesForWordRange: range inString: aString ];
          //[[NSSpellChecker sharedSpellChecker] updateSpellingPanelWithMisspelledWord:misSpelledWord] // Updates the spell checker window with the misspelled word. Since we can't update the text yet, this isn't helpful, so it's commented out.

          //NOTE: There's a possibility we could use the getSelectionFromUser method from the Sketch Javascript API to give a list of options such as "skip, add to dictionary, replace with..."
          //Documetntation here: http://developer.sketchapp.com/reference/api/class/api/Application.js~Application.html#instance-method-alert

          var alert = NSAlert.alloc().init();

          alert.setMessageText('Alert Title');
          //alert.setInformativeText('Alert Text');
          //alert.addButtonWithTitle('OK');
          //alert.addButtonWithTitle('Cancel');
          //alert.setIcon(NSImage.alloc().initWithContentsOfFile(
          //    context.plugin.urlForResourceNamed('DialogIcon512.png').path()));

          var nibui = new NibUI(context,
              'UIBundle', 'MyNibUI',
              ['textMisSpelling', 'replaceComboBox', 'btnSkip', 'btnReplace','btnIgnoreAll','btnAddDict','btnDone','textFullText']);

          alert.setAccessoryView(nibui.view);

          //Set up our text
          nibui.textMisSpelling.stringValue = "Mispelling: "+ misSpelledWord;
          nibui.textFullText.stringValue = aString;

          //Put guesses into the combobox
          nibui.replaceComboBox.addItemsWithObjectValues( guesses );

          //Set up our button functions
          nibui.attachTargetAndAction(nibui.btnReplace, function() {
            //context.document.showMessage('hey');
            //Do text replace
            layer.setIsEditingText(true);
            layer.stringValue = aString.replace( misSpelledWord, nibui.replaceComboBox.objectValueOfSelectedItem);
            layer.setIsEditingText(false);
          });

          nibui.attachTargetAndAction(nibui.btnDone, function() {
            //nibui.exampleLogView.setHidden(nibui.exampleDisclosureButton.state() != NSOnState);
            // Stop!
            stopChecking = true;
          });

          nibui.attachTargetAndAction(nibui.btnIgnoreAll, function(){
            // Use spell checking API for this //https://developer.apple.com/reference/appkit/nsspellchecker?language=objc
            [[NSSpellChecker sharedSpellChecker] ignoreWord: misSpelledWord inSpellDocumentWithTag: documentTag]
          });

          nibui.attachTargetAndAction(nibui.btnSkip, function() {
            // Next!
          });

          nibui.attachTargetAndAction(nibui.addDict, function() {
            // Add the word to the Dictionary.
            // Use the NSSpellchecker method.
            [[NSSpellChecker sharedSpellChecker] learnWord: misSpelledWord]
          });

          alert.runModal();

          nibui.destroy();
        }

	}
  //Builds our little alert
  //allWords = allWords + "\nFound "+misspellingcount+" misspellings in "+[layers count]+" text layers";
  //[[NSApplication sharedApplication] displayDialog:allWords withTitle:"Spellcheck Whole Page"]
  sketch.alert("Found "+misspellingcount+" misspellings in "+[layers count]+" text layers", allWords)
}
