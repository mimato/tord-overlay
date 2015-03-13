
/**
 * Copyright (C) 2008-2012 Mr Temper <MrTemper@CarolinaRollergirls.com>
 * Copyright (C) 2013 Rob Thomas <xrobau@gmail.com>
 *
 * This file is part of the Carolina Rollergirls (CRG) ScoreBoard.
 * The CRG ScoreBoard is licensed under either the GNU General Public
 * License version 3 (or later), or the Apache License 2.0, at your option.
 * See the file COPYING for details.
 */

XML_ELEMENT_SELECTOR = "ScoreBoard";

function setupMainDiv(div) {
	div.css({ position: "fixed" });

	_crgUtils.bindAndRun($(window), "resize", function() {
		var aspect16x9 = _windowFunctions.get16x9Dimensions();
		div.css(aspect16x9).css("fontSize", aspect16x9.height);
	});
}

$sb(function() {
	setupMainDiv($("#mainDiv"));

	var showClocks = function() {
		var pR = $sb("ScoreBoard.Clock(Period).Running").$sbIsTrue();
		var jR = $sb("ScoreBoard.Clock(Jam).Running").$sbIsTrue();
		var lR = $sb("ScoreBoard.Clock(Lineup).Running").$sbIsTrue();
		var tR = $sb("ScoreBoard.Clock(Timeout).Running").$sbIsTrue();
		var iR = $sb("ScoreBoard.Clock(Intermission).Running").$sbIsTrue();
		var iN = $sb("ScoreBoard.Clock(Intermission).Number").$sbGet();

		if (jR) {
			$("div.Clock.JLT").removeClass("ShowLineup ShowTimeout").addClass("ShowJam");
		} else if (tR) {
			$("div.Clock.JLT").removeClass("ShowLineup ShowJam").addClass("ShowTimeout");
		} else if (lR) {
			$("div.Clock.JLT").removeClass("ShowJam ShowTimeout").addClass("ShowLineup");
		} else if (iR) {
			$("div.Clock.JLT").removeClass("ShowJam ShowTimeout ShowLineup");
		} else {
			$("div.Clock.JLT").removeClass("ShowLineup ShowTimeout").addClass("ShowJam");
		}

		if (pR) {
			$("div.Clock.PI").removeClass("ShowIntermission").addClass("ShowPeriod");
		} else if (iR && !jR && !lR && !tR) {
			if (iN == 2) { // Hide intermission clock too for Final
				$("div.Clock.PI").removeClass("ShowPeriod ShowIntermission");
			} else {
				$("div.Clock.PI").removeClass("ShowPeriod").addClass("ShowIntermission");
			}
		} else {
			$("div.Clock.PI").removeClass("ShowIntermission").addClass("ShowPeriod");
		}
	};

	$.each( [ "1", "2" ], function(i, t) {
		var team = $sb("ScoreBoard.Team("+t+")");
		team.$sb("AlternateName(overlay).Name").$sbElement("#OverlayBottom>div.Team"+t+">div.Name>a.AlternateName", { sbelement: { autoFitText: true } }) ;
		team.$sb("Name").$sbElement("#OverlayBottom>div.Team"+t+">div.Name>a.Name", { sbelement: { autoFitText: true } });
		team.$sb("Score").$sbElement("#OverlayBottom>div.Team"+t+">div.Score>a");
		team.$sb("Position(Jammer).Name").$sbElement("#OverlayBottom>div.Team"+t+">div.Jammer>a", { sbelement: { autoFitText: true } });
		team.$sbBindAddRemoveEach("AlternateName", function(event, node) {
			if ($sb(node).$sbId == "overlay")
				$sb(node).$sb("Name").$sbBindAndRun("sbchange", function(event, val) {
					$("#OverlayBottom>div.Team"+t+">div.Name")
						.toggleClass("AlternateName", ($.trim(val) != ""));
				});
		}, function(event, node) {
			if ($sb(node).$sbId == "overlay")
				$("#OverlayBottom>div.Team"+t+">div.Name").removeClass("AlternateName");
		});

        // Lead text when there's no jammer name
        team.$sb("Position(Jammer).Name").$sbBindAndRun("sbchange", function(event, value) {
            $("#OverlayBottom>div.Team"+t+">div.Lead").toggleClass("NoJammer", !value);
        });

        // Lead Changes
		team.$sb("LeadJammer").$sbBindAndRun("sbchange", function(event, val) {
			$("#OverlayBottom>div.Team"+t+">div.Jammer").toggleClass("IsLead", isTrue(val), 1000);
            $("#OverlayBottom>div.Team"+t+">div.Lead").toggleClass("IsLead", isTrue(val), 1000);
		});

		// Timeout text colouring
		team.$sb("Timeouts").$sbBindAndRun("sbchange", function(event, val) { colourTimeouts(t); });
		team.$sb("OfficialReviews").$sbBindAndRun("sbchange", function(event, val) { colourTimeouts(t); });
		$sb("ScoreBoard.Clock(Timeout).Running").$sbBindAndRun("sbchange", function(event, val) { colourTimeouts(t); });
        $sb("ScoreBoard.TImeoutOwner").$sbBindAndRun("sbchange", function(event, val) { colourTimeouts(t); });
	});

	$.each( [ "Period", "Jam", "Intermission"], function(i, c) {
		$sb("ScoreBoard.Clock("+c+").Number")
			.$sbElement("#OverlayBottom>div.Middle>div.Clock>div."+c+".Number>a.Number");
	});

	$.each( [ "Period", "Jam", "Lineup", "Timeout", "Intermission" ], function(i, c) {
		$sb("ScoreBoard.Clock("+c+").Time")
			.$sbElement("#OverlayBottom>div.Middle>div.Clock>div."+c+".Time>a.Time", {
				sbelement: { convert: _timeConversions.msToMinSec }
			});
		$sb("ScoreBoard.Clock("+c+").Running").$sbBindAndRun("sbchange", showClocks);
	});
	// This allows hiding the intermission clock during Final.
	$sb("ScoreBoard.Clock(Intermission).Number").$sbBindAndRun("sbchange", showClocks);

  // JLT Label text.
  var labelTriggers = $sb("ScoreBoard.Clock(Jam).Running")
    .add($sb("ScoreBoard.Clock(Timeout).Running"))
    .add($sb("ScoreBoard.Clock(Lineup).Running"))
    .add($sb("ScoreBoard.TimeoutOwner"))
    .add($sb("ScoreBoard.OfficialReview"))
  _crgUtils.bindAndRun(labelTriggers, "sbchange", function() { manageLabels(); });
});

function manageLabels() {
	var labelString = "";

	if ($sb("Scoreboard.Clock(Jam).Running").$sbIsTrue()) {
		labelString = "J";
	} else if ($sb("Scoreboard.Clock(Timeout).Running").$sbIsTrue()) {
		if (!$sb("ScoreBoard.TimeoutOwner").$sbGet()) {
			labelString = "OTO";
		} else if ($sb("ScoreBoard.OfficialReview").$sbIsTrue()) {
			labelString = "OR";
		} else {
			labelString = "TTO";
		}
	} else if ($sb("Scoreboard.Clock(Lineup).Running").$sbIsTrue()) {
		labelString = "L";
	}

    // If the label has changed, change the text
	var label = $("#OverlayBottom>div.Middle>div.Clock.JLT>div.Label>a");
	if (label.data != labelString) {
		label.data(labelString);
		label.text(labelString);
	}
}

function colourTimeouts(t) {
	// Called when something changes in relation to timeouts.
	var team = $sb("ScoreBoard.Team("+t+")");
	var teamDiv = $("#OverlayBottom>div.Team"+t+">div.Timeouts");
	teamDiv.toggleClass("HasOfficialReview", team.$sb("OfficialReviews").$sbGet() > 0);
	teamDiv.toggleClass("RunningOfficialReview",
        (
        $sb("ScoreBoard.Clock(Timeout).Running").$sbIsTrue()
        && $sb("ScoreBoard.TimeoutOwner").$sbIs(t)
        && $sb("ScoreBoard.OfficialReview").$sbIsTrue()
        )
    );
	$.each( [ 1, 2, 3 ], function(i, n) {
		teamDiv.toggleClass("HasTimeout"+n, team.$sb("Timeouts").$sbGet() >= n);
		teamDiv.toggleClass("RunningTimeout"+n,
		    (
		    team.$sb("Timeouts").$sbIs(n-1)
		    && $sb("ScoreBoard.Clock(Timeout).Running").$sbIsTrue()
		    && $sb("ScoreBoard.TimeoutOwner").$sbIs(t)
		    && !$sb("ScoreBoard.OfficialReview").$sbIsTrue()
		    )
		);
//		teamDiv.removeClass("RunningTimeout"+n,

	});
}

