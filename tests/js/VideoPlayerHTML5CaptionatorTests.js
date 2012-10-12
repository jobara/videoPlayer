/*
Copyright 2012 OCAD University

Licensed under the Educational Community License (ECL), Version 2.0 or the New
BSD license. You may not use this file except in compliance with one these
Licenses.

You may obtain a copy of the ECL 2.0 License and BSD License at
https://github.com/fluid-project/infusion/raw/master/Infusion-LICENSE.txt
 
 */

// Declare dependencies
/*global fluid, jqUnit, jQuery, start, captionator*/

// JSLint options 
/*jslint white: true, funcinvoke: true, undef: true, newcap: true, nomen: true, regexp: true, bitwise: true, browser: true, forin: true, maxerr: 100, indent: 4 */

(function ($) {
    $(document).ready(function () {
        fluid.setLogging(false);    // disable it not to mess up with FireBug in FF
        
        var supportsHtml5 = {
            typeName: "fluid.browser.supportsHtml5"
        };
        
        var container = ".videoPlayer";
        var firstEnglishCaption = "English caption here";
        var firstFrenchCaption = "French caption here";
        var captionatorSelector = ".captionator-cue-canvas";

        var testTrackMode = function (html5Captionator, tracksShowing) {  // tracksShowing is an Array of booleans
            tracksShowing = tracksShowing || [];
            jqUnit.expect(tracksShowing.length);
            var tracks = $("track", html5Captionator.locate("video"));

            $.each(tracksShowing, function (index, showing) {
                var msg = showing ? " set to SHOWING" : " set to OFF";
                jqUnit.assertEquals(html5Captionator.options.captions[index].label + msg, 
                    showing ? captionator.TextTrack.SHOWING : captionator.TextTrack.OFF, tracks[index].track.mode);
            });
        };

        var initVideoPlayer = function (options, onReadyCallback) {
            options = options || {};

            fluid.merge(null, options, {
                listeners: {
                    onReady: onReadyCallback
                }
            });

            return fluid.videoPlayer(container, options);
        };
        // IMPORTANT. RUNS FROM A WEB SERVER: Captionator code does not handle reading files from file system.
        var testCaptionPresence = function (html5Captionator, captionText) {
            jqUnit.expect(1);
            var warningMessage = "WARNING, this test will run only from a web server. ";
            jqUnit.assertEquals(warningMessage + "Caption should be " + captionText, captionText, html5Captionator.locate("caption").find(".captionator-cue").text());
        };
        // config:
        //      options - options to pass in a videoPlayer
        //      isHTML5 - boolean flag to set presence of HTML5 in our test environment
        //      hasComponent - boolean for a check if html5Captionator component is present in the videoPlayer
        //      hasDOMElement - boolean for a check if html5Captionator component's markup is present in the DOM
        //
        var testInit = function (config) {
            jqUnit.expect(2);

            config.testComponentFunc = config.hasComponent ? jqUnit.assertNotUndefined : jqUnit.assertUndefined;
            config.componentStr = config.hasComponent ? "html5Captionator has been instantiated"
                                                        : "html5Captionator has NOT been instantiated";
            config.domStr = config.hasDOMElement ? "Captionator DIV is present in the DOM"
                                                        : "Captionator DIV is NOT present in the DOM";

            initVideoPlayer(config.options, function (videoPlayer) {
                config.testComponentFunc(config.componentStr, videoPlayer.html5Captionator);
                jqUnit.assertEquals(config.domStr, (config.hasDOMElement) ? 1 : 0, $(captionatorSelector).length);
                start();
            });
        };
        var defaultOptionsNoCaptions = {
            video: {
                sources: [
                    {
                        src: "TestVideo.mp4",
                        type: "video/mp4"
                    }
                ]
            },
            templates: {
                videoPlayer: {
                    href: "../../html/videoPlayer_template.html"
                }
            }
        };
        var optionsWithoutCurrentTrack = {};
        var optionsFull = {};
        var optionsFullWithDisplayCaptionsOff = {};

        // build optionsWithoutCurrentTrack based on defaultOptionsNoCaptions with some extra options
        fluid.merge(null, optionsWithoutCurrentTrack, defaultOptionsNoCaptions);
        fluid.merge(null, optionsWithoutCurrentTrack, {
            video: {
                captions: [
                    {
                        src: "TestCaptions.en.vtt",
                        type: "text/vtt",
                        srclang: "en",
                        label: "English Subtitles",
                        kind: "subtitles"
                    },
                    {
                        src: "TestCaptions.fr.vtt",
                        type: "text/vtt",
                        srclang: "fr",
                        label: "French Subtitles",
                        kind: "subtitles"
                    }
                ]
            }
        });

        // build optionsFull based on optionsWithoutCurrentTrack with some extra options
        fluid.merge(null, optionsFull, optionsWithoutCurrentTrack);
        fluid.merge(null, optionsFull, {
            model: {
                currentTracks: {
                    captions: [0]
                },
                displayCaptions: true
            }
        });

        // build optionsFullWithDisplayCaptionsOff based on optionsWithoutCurrentTrack but with displayCaptions set to false
        fluid.merge(null, optionsFullWithDisplayCaptionsOff, optionsWithoutCurrentTrack);
        fluid.merge(null, optionsFullWithDisplayCaptionsOff, {
            model: {
                currentTracks: {
                    captions: [0]
                },
                displayCaptions: false
            }
        });

        // Define tests declaratively
        var testCaseInfo = [{
                desc: "NO HTML5: html5Captionator was not initialized",
                envFeatures: {
                    supportsHtml5: null
                },
                testFn: function () {
                    testInit({
                        options: optionsFull,
                        hasComponent: false,
                        hasDOMElement: false
                    });
                }
            }, {
                desc: "HTML5: html5Captionator was initialized but without tracks",
                envFeatures: {
                    supportsHtml5: supportsHtml5
                },
                testFn: function () {
                    testInit({
                        options: defaultOptionsNoCaptions,
                        hasComponent: true,
                        hasDOMElement: false
                    });
                }
            }, {
                desc: "HTML5: html5Captionator was initialized",
                envFeatures: {
                    supportsHtml5: supportsHtml5
                },
                testFn: function () {
                    testInit({
                        options: optionsFull,
                        hasComponent: true,
                        hasDOMElement: true
                    });
                }
            }, {
                desc: "html5Captionator changing tracks and more",
                envFeatures: {
                    supportsHtml5: supportsHtml5
                },
                testFn: function () {
                    initVideoPlayer(optionsFull, function (videoPlayer) {
                        // VERY BAD. There is no callback for a captionator to fire when it loaded its captions, so we have to wait 1 second before do the test check
                        setTimeout(function () {
                            var tracks = $("track", videoPlayer.html5Captionator.locate("video")),
                                html5Captionator = videoPlayer.html5Captionator;

                            jqUnit.assertNotUndefined("html5Captionator has been instantiated", html5Captionator);
                            testTrackMode(html5Captionator, [true, false]);
                            testCaptionPresence(html5Captionator, firstEnglishCaption);
                            fluid.videoPlayer.html5Captionator.showCurrentTrack([1], tracks, html5Captionator.options.captions);

                            testTrackMode(html5Captionator, [false, true]);
                            // VERY BAD. There is no callback for a captionator to fire when it loaded its captions, so we have to wait 1 second before do the test check
                            setTimeout(function () {
                                testCaptionPresence(html5Captionator, firstFrenchCaption);
                                fluid.videoPlayer.html5Captionator.hideAllTracks(tracks);
                                testTrackMode(html5Captionator, [false, false]);
                                testCaptionPresence(html5Captionator, "");
                                jqUnit.expect(1);
                                start();
                            }, 1000);
                        }, 1000);
                    });
                }
            }, {     // TEST FLUID-4618. Writing a test to verify that functions in preInit work properly
                desc: "html5Captionator displayCaptions test",
                envFeatures: {
                    supportsHtml5: supportsHtml5
                },
                testFn: function () {
                    initVideoPlayer(optionsFull, function (videoPlayer) {
                        // VERY BAD. There is no callback for a captionator to fire when it loaded its captions, so we have to wait 1 second before do the test check
                        setTimeout(function () {
                            var html5Captionator = videoPlayer.html5Captionator;
                            html5Captionator.refreshCaptions();
                            jqUnit.assertNotUndefined("html5Captionator has been instantiated", html5Captionator);
                            testCaptionPresence(html5Captionator, firstEnglishCaption);
                            jqUnit.expect(1);
                            start();
                        }, 1000);
                    });
                }
            }, {
                desc: "html5Captionator without currentTrack",
                envFeatures: {
                    supportsHtml5: supportsHtml5
                },
                testFn: function () {
                    initVideoPlayer(optionsWithoutCurrentTrack, function (videoPlayer) {
                        setTimeout(function () {
                            var html5Captionator = videoPlayer.html5Captionator,
                                currentTracks = html5Captionator.model.currentTracks;

                            jqUnit.assertUndefined("currentTracks is empty in the model", optionsWithoutCurrentTrack.currentTracks);

                            jqUnit.assertNotUndefined("html5Captionator has been instantiated", html5Captionator);

                            jqUnit.assertEquals("Current track is also empty in the html5Captionator model",
                                    0, currentTracks.captions.length);
                            // Can't support this "self-modification" of the model of captionator since it may corrupt data belonging
                            // to others during startup
                            //jqUnit.assertEquals("And this element is the index for the first element in the array of captions", 
                            //        0, currentTracks.captions[0]);

                            testTrackMode(html5Captionator, [false, false]);

                            // Check that captions are not present in the DOM
                            testCaptionPresence(html5Captionator, "");
                            jqUnit.expect(3);
                            start();
                        });
                    });
                }
            }, {
                desc: "displayCaptions is set to false so no captions should be present at all in the DOM",
                envFeatures: {
                    supportsHtml5: supportsHtml5
                },
                testFn: function () {
                    initVideoPlayer(optionsFullWithDisplayCaptionsOff, function (videoPlayer) {
                        setTimeout(function () {
                            var html5Captionator = videoPlayer.html5Captionator;
                            testTrackMode(html5Captionator, [false, false]);
                            // Check that captions are not present in the DOM
                            testCaptionPresence(html5Captionator, "");
                            start();
                        });
                    });
                }
            }];

        fluid.testUtils.testCaseWithEnv("Video Player HTML5 Captionator Test Suite", testCaseInfo);

    });
})(jQuery);
