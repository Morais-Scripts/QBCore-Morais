QB = {}
QB.Phone = {}
QB.Screen = {}
QB.Phone.Functions = {}
QB.Phone.Animations = {}
QB.Phone.Notifications = {}
QB.Phone.ContactColors = {
    0: "#9b59b6",
    1: "#3498db",
    2: "#e67e22",
    3: "#e74c3c",
    4: "#1abc9c",
    5: "#9c88ff",
}

QB.Phone.Data = {
    currentApplication: null,
    PlayerData: {},
    Applications: {},
    IsOpen: false,
    CallActive: false,
    MetaData: {},
    PlayerJob: {},
    AnonymousCall: false,
}

QB.Phone.Data.MaxSlots = 16;

OpenedChatData = {
    number: null,
}

var CanOpenApp = true;

function IsAppJobBlocked(joblist, myjob) {
    var retval = false;
    if (joblist.length > 0) {
        $.each(joblist, function(i, job){
            if (job == myjob && QB.Phone.Data.PlayerData.job.onduty) {
                retval = true;
            }
        });
    }
    return retval;
}

QB.Phone.Functions.SetupApplications = function(data) {
    QB.Phone.Data.Applications = data.applications;

    var i;
    for (i = 1; i <= QB.Phone.Data.MaxSlots; i++) {
        var applicationSlot = $(".phone-applications").find('[data-appslot="'+i+'"]');
        $(applicationSlot).html("");
        $(applicationSlot).css({
            "background-color":"transparent"
        });
        $(applicationSlot).prop('title', "");
        $(applicationSlot).removeData('app');
        $(applicationSlot).removeData('placement')
    }

    $.each(data.applications, function(i, app){
        var applicationSlot = $(".phone-applications").find('[data-appslot="'+app.slot+'"]');
        var blockedapp = IsAppJobBlocked(app.blockedjobs, QB.Phone.Data.PlayerJob.name)

        if ((!app.job || app.job === QB.Phone.Data.PlayerJob.name) && !blockedapp) {
            $(applicationSlot).css({"background-color":app.color});
            var icon = '<i class="ApplicationIcon '+app.icon+'" style="'+app.style+'"></i>';
            if (app.app == "meos") {
                icon = '<img src="./img/politie.png" class="police-icon">';
            }
            $(applicationSlot).html(icon+'<div class="app-unread-alerts">0</div>');
            $(applicationSlot).prop('title', app.tooltipText);
            $(applicationSlot).data('app', app.app);

            if (app.tooltipPos !== undefined) {
                $(applicationSlot).data('placement', app.tooltipPos)
            }
        }
    });

    $('[data-toggle="tooltip"]').tooltip();
}

QB.Phone.Functions.SetupAppWarnings = function(AppData) {
    $.each(AppData, function(i, app){
        var AppObject = $(".phone-applications").find("[data-appslot='"+app.slot+"']").find('.app-unread-alerts');

        if (app.Alerts > 0) {
            $(AppObject).html(app.Alerts);
            $(AppObject).css({"display":"block"});
        } else {
            $(AppObject).css({"display":"none"});
        }
    });
}

QB.Phone.Functions.IsAppHeaderAllowed = function(app) {
    var retval = true;
    $.each(Config.HeaderDisabledApps, function(i, blocked){
        if (app == blocked) {
            retval = false;
        }
    });
    return retval;
}

$(document).on('click', '.phone-application', function(e){
    e.preventDefault();
    var PressedApplication = $(this).data('app');
    var AppObject = $("."+PressedApplication+"-app");

    if (AppObject.length !== 0) {
        if (CanOpenApp) {
            if (QB.Phone.Data.currentApplication == null) {
                QB.Phone.Animations.TopSlideDown('.phone-application-container', 300, 0);
                QB.Phone.Functions.ToggleApp(PressedApplication, "block");
                
                if (QB.Phone.Functions.IsAppHeaderAllowed(PressedApplication)) {
                    QB.Phone.Functions.HeaderTextColor("black", 300);
                }
    
                QB.Phone.Data.currentApplication = PressedApplication;
    
                if (PressedApplication == "settings") {
                    $("#myPhoneNumber").text(QB.Phone.Data.PlayerData.charinfo.phone);
                    $("#mySerialNumber").text("LUN-" + QB.Phone.Data.PlayerData.metadata["phonedata"].SerialNumber);
                } else if (PressedApplication == "twitter") {
                    $.post('http://qb-phone_new/GetMentionedTweets', JSON.stringify({}), function(MentionedTweets){
                        QB.Phone.Notifications.LoadMentionedTweets(MentionedTweets)
                    })
                    $.post('http://qb-phone_new/GetHashtags', JSON.stringify({}), function(Hashtags){
                        QB.Phone.Notifications.LoadHashtags(Hashtags)
                    })
                    if (QB.Phone.Data.IsOpen) {
                        $.post('http://qb-phone_new/GetTweets', JSON.stringify({}), function(Tweets){
                            QB.Phone.Notifications.LoadTweets(Tweets);
                        });
                    }
                } else if (PressedApplication == "bank") {
                    QB.Phone.Functions.DoBankOpen();
                    $.post('http://qb-phone_new/GetBankContacts', JSON.stringify({}), function(contacts){
                        QB.Phone.Functions.LoadContactsWithNumber(contacts);
                    });
                    $.post('http://qb-phone_new/GetInvoices', JSON.stringify({}), function(invoices){
                        QB.Phone.Functions.LoadBankInvoices(invoices);
                    });
                } else if (PressedApplication == "whatsapp") {
                    $.post('http://qb-phone_new/GetWhatsappChats', JSON.stringify({}), function(chats){
                        QB.Phone.Functions.LoadWhatsappChats(chats);
                    });
                } else if (PressedApplication == "phone") {
                    $.post('http://qb-phone_new/GetMissedCalls', JSON.stringify({}), function(recent){
                        QB.Phone.Functions.SetupRecentCalls(recent);
                    });
                    $.post('http://qb-phone_new/GetSuggestedContacts', JSON.stringify({}), function(suggested){
                        QB.Phone.Functions.SetupSuggestedContacts(suggested);
                    });
                    $.post('http://qb-phone_new/ClearGeneralAlerts', JSON.stringify({
                        app: "phone"
                    }));
                } else if (PressedApplication == "mail") {
                    $.post('http://qb-phone_new/GetMails', JSON.stringify({}), function(mails){
                        QB.Phone.Functions.SetupMails(mails);
                    });
                    $.post('http://qb-phone_new/ClearGeneralAlerts', JSON.stringify({
                        app: "mail"
                    }));
                } else if (PressedApplication == "advert") {
                    $.post('http://qb-phone_new/LoadAdverts', JSON.stringify({}), function(Adverts){
                        QB.Phone.Functions.RefreshAdverts(Adverts);
                    })
                } else if (PressedApplication == "garage") {
                    $.post('http://qb-phone_new/SetupGarageVehicles', JSON.stringify({}), function(Vehicles){
                        SetupGarageVehicles(Vehicles);
                    })
                } else if (PressedApplication == "crypto") {
                    $.post('http://qb-phone_new/GetCryptoData', JSON.stringify({
                        crypto: "qbit",
                    }), function(CryptoData){
                        SetupCryptoData(CryptoData);
                    })

                    $.post('http://qb-phone_new/GetCryptoTransactions', JSON.stringify({}), function(data){
                        RefreshCryptoTransactions(data);
                    })
                } else if (PressedApplication == "racing") {
                    $.post('http://qb-phone_new/GetAvailableRaces', JSON.stringify({}), function(Races){
                        SetupRaces(Races);
                    });
                } else if (PressedApplication == "houses") {
                    $.post('http://qb-phone_new/GetPlayerHouses', JSON.stringify({}), function(Houses){
                        SetupPlayerHouses(Houses);
                    });
                    $.post('http://qb-phone_new/GetPlayerKeys', JSON.stringify({}), function(Keys){
                        $(".house-app-mykeys-container").html("");
                        if (Keys.length > 0) {
                            $.each(Keys, function(i, key){
                                var elem = '<div class="mykeys-key" id="keyid-'+i+'"> <span class="mykeys-key-label">' + key.HouseData.adress + '</span> <span class="mykeys-key-sub">Klik om GPS in te stellen</span> </div>';

                                $(".house-app-mykeys-container").append(elem);
                                $("#keyid-"+i).data('KeyData', key);
                            });
                        }
                    });
                } else if (PressedApplication == "meos") {
                    SetupMeosHome();
                } else if (PressedApplication == "lawyers") {
                    $.post('http://qb-phone_new/GetCurrentLawyers', JSON.stringify({}), function(data){
                        SetupLawyers(data);
                    });
                } else if (PressedApplication == "taxis") {
                    $.post('http://qb-phone_new/GetCurrentTaxis', JSON.stringify({}), function(data){
                        SetupTaxis(data);
                    });
                } else if (PressedApplication == "mecanicos") {
                    $.post('http://qb-phone_new/GetCurrentMecanicos', JSON.stringify({}), function(data){
                        SetupMecanicos(data);
                    });
                } else if (PressedApplication == "store") {
                    $.post('http://qb-phone_new/SetupStoreApps', JSON.stringify({}), function(data){
                        SetupAppstore(data); 
                    });
                } else if (PressedApplication == "trucker") {
                    $.post('http://qb-phone_new/GetTruckerData', JSON.stringify({}), function(data){
                        SetupTruckerInfo(data);
                    });
                }
            }
        }
    } else {
        QB.Phone.Notifications.Add("fas fa-exclamation-circle", "Sistema", QB.Phone.Data.Applications[PressedApplication].tooltipText+" não esta disponivel!")
    }
});

$(document).on('click', '.mykeys-key', function(e){
    e.preventDefault();

    var KeyData = $(this).data('KeyData');

    $.post('http://qb-phone_new/SetHouseLocation', JSON.stringify({
        HouseData: KeyData
    }))
});

$(document).on('click', '.phone-home-container', function(event){
    event.preventDefault();

    if (QB.Phone.Data.currentApplication === null) {
        QB.Phone.Functions.Close();
    } else {
        QB.Phone.Animations.TopSlideUp('.phone-application-container', 400, -160);
        QB.Phone.Animations.TopSlideUp('.'+QB.Phone.Data.currentApplication+"-app", 400, -160);
        CanOpenApp = false;
        setTimeout(function(){
            QB.Phone.Functions.ToggleApp(QB.Phone.Data.currentApplication, "none");
            CanOpenApp = true;
        }, 400)
        QB.Phone.Functions.HeaderTextColor("white", 300);

        if (QB.Phone.Data.currentApplication == "whatsapp") {
            if (OpenedChatData.number !== null) {
                setTimeout(function(){
                    $(".whatsapp-chats").css({"display":"block"});
                    $(".whatsapp-chats").animate({
                        left: 0+"vh"
                    }, 1);
                    $(".whatsapp-openedchat").animate({
                        left: -30+"vh"
                    }, 1, function(){
                        $(".whatsapp-openedchat").css({"display":"none"});
                    });
                    OpenedChatPicture = null;
                    OpenedChatData.number = null;
                }, 450);
            }
        } else if (QB.Phone.Data.currentApplication == "bank") {
            if (CurrentTab == "invoices") {
                setTimeout(function(){
                    $(".bank-app-invoices").animate({"left": "30vh"});
                    $(".bank-app-invoices").css({"display":"none"})
                    $(".bank-app-accounts").css({"display":"block"})
                    $(".bank-app-accounts").css({"left": "0vh"});
    
                    var InvoicesObjectBank = $(".bank-app-header").find('[data-headertype="invoices"]');
                    var HomeObjectBank = $(".bank-app-header").find('[data-headertype="accounts"]');
    
                    $(InvoicesObjectBank).removeClass('bank-app-header-button-selected');
                    $(HomeObjectBank).addClass('bank-app-header-button-selected');
    
                    CurrentTab = "accounts";
                }, 400)
            }
        } else if (QB.Phone.Data.currentApplication == "meos") {
            $(".meos-alert-new").remove();
            setTimeout(function(){
                $(".meos-recent-alert").removeClass("noodknop");
                $(".meos-recent-alert").css({"background-color":"#004682"}); 
            }, 400)
        }

        QB.Phone.Data.currentApplication = null;
    }
});

QB.Phone.Functions.Open = function(data) {
    QB.Phone.Animations.BottomSlideUp('.container', 300, 0);
    QB.Phone.Notifications.LoadTweets(data.Tweets);
    QB.Phone.Data.IsOpen = true;
}

QB.Phone.Functions.ToggleApp = function(app, show) {
    $("."+app+"-app").css({"display":show});
}

QB.Phone.Functions.Close = function() {

    if (QB.Phone.Data.currentApplication == "whatsapp") {
        setTimeout(function(){
            QB.Phone.Animations.TopSlideUp('.phone-application-container', 400, -160);
            QB.Phone.Animations.TopSlideUp('.'+QB.Phone.Data.currentApplication+"-app", 400, -160);
            $(".whatsapp-app").css({"display":"none"});
            QB.Phone.Functions.HeaderTextColor("white", 300);
    
            if (OpenedChatData.number !== null) {
                setTimeout(function(){
                    $(".whatsapp-chats").css({"display":"block"});
                    $(".whatsapp-chats").animate({
                        left: 0+"vh"
                    }, 1);
                    $(".whatsapp-openedchat").animate({
                        left: -30+"vh"
                    }, 1, function(){
                        $(".whatsapp-openedchat").css({"display":"none"});
                    });
                    OpenedChatData.number = null;
                }, 450);
            }
            OpenedChatPicture = null;
            QB.Phone.Data.currentApplication = null;
        }, 500)
    } else if (QB.Phone.Data.currentApplication == "meos") {
        $(".meos-alert-new").remove();
        $(".meos-recent-alert").removeClass("noodknop");
        $(".meos-recent-alert").css({"background-color":"#004682"}); 
    }

    QB.Phone.Animations.BottomSlideDown('.container', 300, -70);
    $.post('http://qb-phone_new/Close');
    QB.Phone.Data.IsOpen = false;
}

QB.Phone.Functions.HeaderTextColor = function(newColor, Timeout) {
    $(".phone-header").animate({color: newColor}, Timeout);
}

QB.Phone.Animations.BottomSlideUp = function(Object, Timeout, Percentage) {
    $(Object).css({'display':'block'}).animate({
        bottom: Percentage+"%",
    }, Timeout);
}

QB.Phone.Animations.BottomSlideDown = function(Object, Timeout, Percentage) {
    $(Object).css({'display':'block'}).animate({
        bottom: Percentage+"%",
    }, Timeout, function(){
        $(Object).css({'display':'none'});
    });
}

QB.Phone.Animations.TopSlideDown = function(Object, Timeout, Percentage) {
    $(Object).css({'display':'block'}).animate({
        top: Percentage+"%",
    }, Timeout);
}

QB.Phone.Animations.TopSlideUp = function(Object, Timeout, Percentage, cb) {
    $(Object).css({'display':'block'}).animate({
        top: Percentage+"%",
    }, Timeout, function(){
        $(Object).css({'display':'none'});
    });
}

QB.Phone.Notifications.Add = function(icon, title, text, color, timeout) {
    $.post('http://qb-phone_new/HasPhone', JSON.stringify({}), function(HasPhone){
        if (HasPhone) {
            if (timeout == null && timeout == undefined) {
                timeout = 1500;
            }
            if (QB.Phone.Notifications.Timeout == undefined || QB.Phone.Notifications.Timeout == null) {
                if (color != null || color != undefined) {
                    $(".notification-icon").css({"color":color});
                    $(".notification-title").css({"color":color});
                } else if (color == "default" || color == null || color == undefined) {
                    $(".notification-icon").css({"color":"#e74c3c"});
                    $(".notification-title").css({"color":"#e74c3c"});
                }
                QB.Phone.Animations.TopSlideDown(".phone-notification-container", 200, 8);
                if (icon !== "politie") {
                    $(".notification-icon").html('<i class="'+icon+'"></i>');
                } else {
                    $(".notification-icon").html('<img src="./img/politie.png" class="police-icon-notify">');
                }
                $(".notification-title").html(title);
                $(".notification-text").html(text);
                if (QB.Phone.Notifications.Timeout !== undefined || QB.Phone.Notifications.Timeout !== null) {
                    clearTimeout(QB.Phone.Notifications.Timeout);
                }
                QB.Phone.Notifications.Timeout = setTimeout(function(){
                    QB.Phone.Animations.TopSlideUp(".phone-notification-container", 200, -8);
                    QB.Phone.Notifications.Timeout = null;
                }, timeout);
            } else {
                if (color != null || color != undefined) {
                    $(".notification-icon").css({"color":color});
                    $(".notification-title").css({"color":color});
                } else {
                    $(".notification-icon").css({"color":"#e74c3c"});
                    $(".notification-title").css({"color":"#e74c3c"});
                }
                $(".notification-icon").html('<i class="'+icon+'"></i>');
                $(".notification-title").html(title);
                $(".notification-text").html(text);
                if (QB.Phone.Notifications.Timeout !== undefined || QB.Phone.Notifications.Timeout !== null) {
                    clearTimeout(QB.Phone.Notifications.Timeout);
                }
                QB.Phone.Notifications.Timeout = setTimeout(function(){
                    QB.Phone.Animations.TopSlideUp(".phone-notification-container", 200, -8);
                    QB.Phone.Notifications.Timeout = null;
                }, timeout);
            }
        }
    });
}

QB.Phone.Functions.LoadPhoneData = function(data) {
    QB.Phone.Data.PlayerData = data.PlayerData;
    QB.Phone.Data.PlayerJob = data.PlayerJob;
    QB.Phone.Data.MetaData = data.PhoneData.MetaData;
    QB.Phone.Functions.LoadMetaData(data.PhoneData.MetaData);
    QB.Phone.Functions.LoadContacts(data.PhoneData.Contacts);
    QB.Phone.Functions.SetupApplications(data);
    console.log("Phone succesfully loaded!");
}

QB.Phone.Functions.UpdateTime = function(data) {    
    var NewDate = new Date();
    var NewHour = NewDate.getHours();
    var NewMinute = NewDate.getMinutes();
    var Minutessss = NewMinute;
    var Hourssssss = NewHour;
    if (NewHour < 10) {
        Hourssssss = "0" + Hourssssss;
    }
    if (NewMinute < 10) {
        Minutessss = "0" + NewMinute;
    }
    var MessageTime = Hourssssss + ":" + Minutessss

    $("#phone-time").html(MessageTime + " <span style='font-size: 1.1vh;'>" + data.InGameTime.hour + ":" + data.InGameTime.minute + "</span>");
}

var NotificationTimeout = null;

QB.Screen.Notification = function(title, content, icon, timeout, color) {
    $.post('http://qb-phone_new/HasPhone', JSON.stringify({}), function(HasPhone){
        if (HasPhone) {
            if (color != null && color != undefined) {
                $(".screen-notifications-container").css({"background-color":color});
            }
            $(".screen-notification-icon").html('<i class="'+icon+'"></i>');
            $(".screen-notification-title").text(title);
            $(".screen-notification-content").text(content);
            $(".screen-notifications-container").css({'display':'block'}).animate({
                right: 5+"vh",
            }, 200);
        
            if (NotificationTimeout != null) {
                clearTimeout(NotificationTimeout);
            }
        
            NotificationTimeout = setTimeout(function(){
                $(".screen-notifications-container").animate({
                    right: -35+"vh",
                }, 200, function(){
                    $(".screen-notifications-container").css({'display':'none'});
                });
                NotificationTimeout = null;
            }, timeout);
        }
    });
}

// QB.Screen.Notification("Nieuwe Tweet", "Dit is een test tweet like #YOLO", "fab fa-twitter", 4000);

$(document).ready(function(){
    window.addEventListener('message', function(event) {
        switch(event.data.action) {
            case "open":
                QB.Phone.Functions.Open(event.data);
                QB.Phone.Functions.SetupAppWarnings(event.data.AppData);
                QB.Phone.Functions.SetupCurrentCall(event.data.CallData);
                QB.Phone.Data.IsOpen = true;
                QB.Phone.Data.PlayerData = event.data.PlayerData;
                break;
            // case "LoadPhoneApplications":
            //     QB.Phone.Functions.SetupApplications(event.data);
            //     break;
            case "LoadPhoneData":
                QB.Phone.Functions.LoadPhoneData(event.data);
                break;
            case "UpdateTime":
                QB.Phone.Functions.UpdateTime(event.data);
                break;
            case "Notification":
                QB.Screen.Notification(event.data.NotifyData.title, event.data.NotifyData.content, event.data.NotifyData.icon, event.data.NotifyData.timeout, event.data.NotifyData.color);
                break;
            case "PhoneNotification":
                QB.Phone.Notifications.Add(event.data.PhoneNotify.icon, event.data.PhoneNotify.title, event.data.PhoneNotify.text, event.data.PhoneNotify.color, event.data.PhoneNotify.timeout);
                break;
            case "RefreshAppAlerts":
                QB.Phone.Functions.SetupAppWarnings(event.data.AppData);                
                break;
            case "UpdateMentionedTweets":
                QB.Phone.Notifications.LoadMentionedTweets(event.data.Tweets);                
                break;
            case "UpdateBank":
                $(".bank-app-account-balance").html("&euro; "+event.data.NewBalance);
                $(".bank-app-account-balance").data('balance', event.data.NewBalance);
                break;
            case "UpdateChat":
                if (QB.Phone.Data.currentApplication == "whatsapp") {
                    if (OpenedChatData.number !== null && OpenedChatData.number == event.data.chatNumber) {
                        console.log('Chat reloaded')
                        QB.Phone.Functions.SetupChatMessages(event.data.chatData);
                    } else {
                        console.log('Chats reloaded')
                        QB.Phone.Functions.LoadWhatsappChats(event.data.Chats);
                    }
                }
                break;
            case "UpdateHashtags":
                QB.Phone.Notifications.LoadHashtags(event.data.Hashtags);
                break;
            case "RefreshWhatsappAlerts":
                QB.Phone.Functions.ReloadWhatsappAlerts(event.data.Chats);
                break;
            case "CancelOutgoingCall":
                $.post('http://qb-phone_new/HasPhone', JSON.stringify({}), function(HasPhone){
                    if (HasPhone) {
                        CancelOutgoingCall();
                    }
                });
                break;
            case "IncomingCallAlert":
                $.post('http://qb-phone_new/HasPhone', JSON.stringify({}), function(HasPhone){
                    if (HasPhone) {
                        IncomingCallAlert(event.data.CallData, event.data.Canceled, event.data.AnonymousCall);
                    }
                });
                break;
            case "SetupHomeCall":
                QB.Phone.Functions.SetupCurrentCall(event.data.CallData);
                break;
            case "AnswerCall":
                QB.Phone.Functions.AnswerCall(event.data.CallData);
                break;
            case "UpdateCallTime":
                var CallTime = event.data.Time;
                var date = new Date(null);
                date.setSeconds(CallTime);
                var timeString = date.toISOString().substr(11, 8);

                if (!QB.Phone.Data.IsOpen) {
                    if ($(".call-notifications").css("right") !== "52.1px") {
                        $(".call-notifications").css({"display":"block"});
                        $(".call-notifications").animate({right: 5+"vh"});
                    }
                    $(".call-notifications-title").html("Chamada ("+timeString+")");
                    $(".call-notifications-content").html("Em chamada com "+event.data.Name);
                    $(".call-notifications").removeClass('call-notifications-shake');
                } else {
                    $(".call-notifications").animate({
                        right: -35+"vh"
                    }, 400, function(){
                        $(".call-notifications").css({"display":"none"});
                    });
                }

                $(".phone-call-ongoing-time").html(timeString);
                $(".phone-currentcall-title").html("Chamada ("+timeString+")");
                break;
            case "CancelOngoingCall":
                $(".call-notifications").animate({right: -35+"vh"}, function(){
                    $(".call-notifications").css({"display":"none"});
                });
                QB.Phone.Animations.TopSlideUp('.phone-application-container', 400, -160);
                setTimeout(function(){
                    QB.Phone.Functions.ToggleApp("phone-call", "none");
                    $(".phone-application-container").css({"display":"none"});
                }, 400)
                QB.Phone.Functions.HeaderTextColor("white", 300);
    
                QB.Phone.Data.CallActive = false;
                QB.Phone.Data.currentApplication = null;
                break;
            case "RefreshContacts":
                QB.Phone.Functions.LoadContacts(event.data.Contacts);
                break;
            case "UpdateMails":
                QB.Phone.Functions.SetupMails(event.data.Mails);
                break;
            case "RefreshAdverts":
                if (QB.Phone.Data.currentApplication == "advert") {
                    QB.Phone.Functions.RefreshAdverts(event.data.Adverts);
                }
                break;
            case "AddPoliceAlert":
                AddPoliceAlert(event.data)
                break;
            case "UpdateApplications":
                QB.Phone.Data.PlayerJob = event.data.JobData;
                QB.Phone.Functions.SetupApplications(event.data);
                break;
            case "UpdateTransactions":
                RefreshCryptoTransactions(event.data);
                break;
            case "UpdateRacingApp":
                $.post('http://qb-phone_new/GetAvailableRaces', JSON.stringify({}), function(Races){
                    SetupRaces(Races);
                });
                break;
            case "RefreshAlerts":
                QB.Phone.Functions.SetupAppWarnings(event.data.AppData);
                break;
        }
    })
});

$(document).on('keydown', function() {
    switch(event.keyCode) {
        case 27: // ESCAPE
            QB.Phone.Functions.Close();
            break;
    }
});

// QB.Phone.Functions.Open();