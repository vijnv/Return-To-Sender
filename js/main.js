(function ($) {
    'use strict';

    // Init
    var gmail = new Gmail($);
    var initialised = false;
    
    var init = function() {
        if (initialised) return;
        
        if (gmail.check.is_inside_email()) {
            parse_email(gmail.get.email_id());
        }
        
        initialised = true;
    };
    
    // After Gmail finishes loading, check if it's displaying an e-mail
    gmail.observe.on("load", function (id, url, body, xhr) {
        console.log('RTS Load event init');
        init();
    });
    
    // Fallback for missing load event
    setTimeout(function() {
        console.log('RTS Load timeout init');
        init();
    }, 1000);
    

    // Follow open e-mail
    gmail.observe.on("open_email", function (id, url, body, xhr) {
        parse_email(id);
    });
    
    // Parse e-mail
    var parse_email = function(msgid) {
        //console.log('Parse trigger');
        var data = gmail.get.email_data(msgid);
        //console.log('Data',data);
        $.each(data.threads, function(id, thread) {
            console.log('Thread trigger');
              if (thread.from_email == "mailer-daemon@googlemail.com" && thread.subject.indexOf("Delivery Status Notification") == 0) {
                  var errors = {
                    "550 5.1.1" : "notfound",
                    "550 Requested action not taken: mailbox unavailable" : "notfound",
                    "550 No such recipient here" : "notfound",
                    "550 Invalid recipient" : "notfound",
                    "550 Mailbox unavailable" : "notfound",
                    "554 delivery error: dd This user doesn't have a" : "notfound",
                    "DNS Error: Domain name not found" : "domain",
                    "This group may not be open to posting" : "group",
                    "Quota exceeded" : "quota"
                  };
                  
                  var errorType = "unknown";
                  for (var error in errors) {
                     if (thread.content_html.indexOf(error) >= 0) {
                         errorType = errors[error];
                         break;
                     }
                  }
                  
                  var address = thread.content_html.match(/To: <a href=\"mailto:(\S+)\">/);
                  if (address) {
                      address = address[1];
                  }
                  display_message(id, thread, errorType, address);
              }
        });
    };
    
    var display_message = function(msgid, thread, errorType, address) {
        $(".m"+msgid+" > div").hide();
        var str = "<div class='rts-error'>";
        str += "<h1>"+t("title")+"</h1>";
        str += "<p>"+t('intro')+" "+address+".</p>";
        str += "<p>"+t(errorType)+".</p>";
        str += "<p><button id='rts-resend-"+msgid+"' class='rts-button primary'>"+t("resend")+"</button></p>";
        str += "<p><button id='rts-expand-"+msgid+"' class='rts-button right'>"+t("expand")+"</button></p>";
        str += "<p><button id='rts-report-"+msgid+"' class='rts-button right'>"+t("report")+"</button></p>";
        str += "</div>";
        $(".m"+msgid).prepend(str);
        
        // Report missing button click handler
        $("#rts-report-"+msgid).click({ content_html: thread.content_html }, function(e){
            e.preventDefault();
            var rtsmessage = e.data.content_html;
            rtsmessage = rtsmessage.split("----- Original message -----");
            rtsmessage = $("<div/>").html(rtsmessage[0]).text();
            rtsmessage = "Report of a missing error message:\n\n" + rtsmessage;
            $.ajax({
                type: "POST",
                url: "https://doorbell.io/api/applications/282/submit?key=E9TRz0VTpTUts4Vmct8AgY2CblGVVRuI0aCSQ2oJB6POWzY1pBLvebSlKZIbRQzN",
                data: {
                    email: gmail.get.user_email(),
                    message: rtsmessage
                },
                error: function(xhr, status, error) {
                    console.log("Report error", status, error);
                },
                success: function(data, status, xhr) {
                    //console.log("Report success", data);
                }
            });
            $(this).after("<br/>"+t("reportsend"));
            $(this).prop('disabled', true);
        });
        
        // Resend e-mail click handler
        if (thread.reply_to_id) {
            $("#rts-resend-"+msgid).click({ msgid: thread.reply_to_id }, function(e){
                e.preventDefault();
                var origmsg = gmail.get.email_data(e.data.msgid).threads[e.data.msgid];
                var url = "https://mail.google.com/mail/?view=cm&fs=1&";
                url += $.param({
                    to: origmsg.to.join(),
                    su: origmsg.subject,
                    body: $("<div/>").html(origmsg.content_html).text()
                });
                window.open(url, "compose", "width=600, height=600, top="+window.screen.height/2+", left="+window.screen.width/2);
            });
        } else {
            $("#rts-resend-"+msgid).prop('disabled', true);
            $("#rts-resend-"+msgid).prop('title', t("resendtip"));
        };
        
        // Show original error message click handler
        $("#rts-expand-"+msgid).click({ msgid: msgid }, function(e){
            $(".m"+e.data.msgid+" > div").eq(1).toggle();
        });
    };
    
    
    // I18n function
    var t = function(txt) {
        var locale = gmail.tracker.globals[17][9][8];
        if (typeof locale !== "string") {
            locale = navigator.language;
        }
        var dictionary;

        switch (locale) {
    
            case 'nl':
                dictionary = {
                    'title': 'We konden het bericht niet bezorgen',
                    'intro': 'Helaas is het ons niet gelukt het bericht te bezorgen dat je had verstuurd aan',
                    'resend': 'Stuur dit bericht opnieuw',
                    'resendtip' : 'Origineel bericht niet gevonden in conversatie',
                    'expand': 'Volledige foutmelding',
                    'report': 'Feedback',
                    'reportsend': 'Je feedback is verzonden, bedantk!',
                    'notfound': 'Het e-mail adres waaraan dit bericht is verzonden bestaat niet of is verwijderd',
                    'domain': 'De domeinnaam (het gedeelte achter de @ in het e-mail adres) bestaat niet. Het domein is niet langer actief of wellicht heb je een fout gemaakt in het adres.',
                    'group': 'Je hebt dit bericht verzonden aan een e-mail groep welke je bericht niet heeft geaccepteerd.',
                    'quota': 'Het postvak van de ontvanger is vol. Je kunt de e-mail pas verzenden wanneer de ontvanger meer ruimte heeft vrijgemaakt.',
                    'unknown': 'De Return To Sender extensie herkent deze foutmelding nog niet. Gebruik s.v.p. de \'Feedback\' knop om dit bericht aan ons door te geven. Bedankt!'
                };
                break;                
            
            
            case 'en':
            default:
                dictionary = {
                    'title': 'We couldn\'t deliver your message',
                    'intro': 'Unfortunately we failed to deliver the message you send to',
                    'resend': 'Send this message again',
                    'resendtip' : 'Original message not present in thread',
                    'expand': 'Full error message',
                    'report': 'Report this error',
                    'reportsend': 'Your feedback has been sent, thank you!',
                    'notfound': 'The e-mail address you tried to send this message to does not exist or has been deleted',
                    'domain': 'The domain name (the part after the @ in the e-mail address) does not exist. Either the domain name is no longer active or there might be a mistake in the address.',
                    'group': 'You\'re posting to an e-mail group that did not accept your message.',
                    'quota': 'The recepients\'s mailbox is full.',
                    'unknown': 'The Return To Sender extension doesn\'t know about this error message yet. Please use the \'Feedback\' button to send the error message to us. Thank you!'
                };
        }

        return dictionary[txt];                
    }
    
})(jQuery);

document.getElementById("rts-main").dataset.loaded=1;