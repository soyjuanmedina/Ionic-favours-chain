import { importExpr } from "@angular/compiler/src/output/output_ast";
import { Component } from "@angular/core";
import { NavController, IonicPage, NavParams } from "ionic-angular";
import * as _ from "lodash";

import { TranslateService } from "@ngx-translate/core";

import { AuthProvider } from "../../providers/auth/auth";

import { Geolocation } from "@ionic-native/geolocation";
import { Platform } from "ionic-angular";
declare var google: any;
declare var localStorage: any;

import { LoadingController } from "ionic-angular";

//Pages
import { AskingPage } from "../asking/asking";
import { FavourPage } from "../favour/favour";
import { ShowAllFavoursPage } from "../show-all-favours/show-all-favours";
import { LoginPage } from "../login/login";
import { UserProfilePage } from "../user-profile/user-profile";

//Providers
import { DatabaseProvider } from "../../providers/database/database";

@Component({
  selector: "page-home",
  templateUrl: "home.html"
})
export class HomePage {
  user: any;
  myFavours = [];
  favoursInMyLocation = [];
  favoursWithoutLocation = [];
  favoursIllDo = [];
  allFavours = [];
  coords: any = { lat: 0, lng: 0 };
  address: string;
  idioms: any;

  constructor(
    public navCtrl: NavController,
    public auth: AuthProvider,
    public translateService: TranslateService,
    public platform: Platform,
    private geolocation: Geolocation,
    private _DB: DatabaseProvider,
    public loadingCtrl: LoadingController
  ) {
    this.idioms = [
      {
        value: "es",
        label: "SPANISH"
      },
      {
        value: "en",
        label: "ENGLISH"
      }
    ];

    platform.ready().then(() => {
      // La plataforma esta lista y ya tenemos acceso a los plugins.
      this.getLocation();
    });
  }

  getAllFavours(email) {
    let loader = this.loadingCtrl.create({
      content: "Please wait..."
    });
    loader.present();
    this._DB
      .getDocuments("favours")
      .then(data => {
        let favours = [];
        data.forEach(function(documentSnapshot) {
          let favour = documentSnapshot.data();
          favour.id = documentSnapshot.id;
          favours.push(favour);
        });
        this.allFavours = favours;
        this.myFavours = this.allFavours.filter(function(favour) {
          return favour.askedMail == localStorage.email;
        });
        this.myFavours = _.orderBy(this.myFavours, ["status"], ["asc"]);
        this.favoursInMyLocation = this.allFavours.filter(function(favour) {
          return (
            favour.location == localStorage.location &&
            favour.doItUserId != localStorage.userId &&
            favour.askedMail != localStorage.email &&
            favour.status == "1-Asked"
          );
        });
        this.favoursWithoutLocation = this.allFavours.filter(function(favour) {
          return (
            favour.location == "" &&
            favour.doItUserId != localStorage.userId &&
            favour.askedMail != localStorage.email &&
            favour.status == "1-Asked"
          );
        });
        this.favoursIllDo = this.allFavours.filter(function(favour) {
          return favour.doItUserId == localStorage.userId;
        });
        this.favoursIllDo = _.orderBy(this.favoursIllDo, ["status"], ["asc"]);
      })
      .catch(error => {
        console.log(error);
      });
    loader.dismiss();
  }

  getLocation(): any {
    this.geolocation
      .getCurrentPosition()
      .then(res => {
        this.coords.lat = res.coords.latitude;
        this.coords.lng = res.coords.longitude;
        this.getAddress(this.coords).then(res => {
          this.address = res[1]["formatted_address"];
          localStorage.setItem("location", this.address);
        });
      })
      .catch(error => {
        console.log(error);
      });
  }

  getAddress(coords): any {
    var geocoder = new google.maps.Geocoder();
    return new Promise(function(resolve, reject) {
      geocoder.geocode({ location: coords }, function(results, status) {
        // llamado asincronamente
        if (status == google.maps.GeocoderStatus.OK) {
          resolve(results);
        } else {
          reject(status);
        }
      });
    });
  }

  setLanguage(lang) {
    this.translateService.use(lang);
  }

  askFavour() {
    console.log(this.coords);
    this.navCtrl.push(AskingPage, this.coords);
  }

  closeSesion() {
    this.auth.logout();
    this.navCtrl.setRoot(LoginPage);
  }

  viewProfile(userId) {
    this.navCtrl.push(UserProfilePage, { userId });
  }

  showFavour(favour) {
    this.navCtrl.push(FavourPage, { favour });
  }

  ShowAll(favoursArray) {
    console.log(favoursArray);
    this.navCtrl.push(ShowAllFavoursPage, { favoursArray });
  }

  ionViewWillEnter() {
    if (localStorage) {
      this.user = localStorage;
      this.getAllFavours(localStorage.email);
    }
  }
}
