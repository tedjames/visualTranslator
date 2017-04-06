import React, { Component } from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  ListView,
  ActivityIndicator,
  AsyncStorage,
  Linking,
  StatusBar
} from 'react-native';
import Camera from 'react-native-camera';
import Icon from 'react-native-vector-icons/FontAwesome';
import Modal from 'react-native-modalbox';
import Clarifai from 'clarifai'

// API Keys
import apiKeys from '../src/apiKeys.json';
const yandexKey = apiKeys.yandex;

// Yandex, for translating concepts
const yandexGetLang = `https://translate.yandex.net/api/v1.5/tr.json/getLangs?key=${yandexKey}&ui=en`;
const yandexGetTranslate = `https://translate.yandex.net/api/v1.5/tr.json/translate?key=${yandexKey}`;

// Clarifai, for image recognition
const app = new Clarifai.App(apiKeys.clarifai.id, apiKeys.clarifai.secret);


export default class App extends Component {
  render() {
    return (
      <Text>{yandexKey}</Text>
    );
  }
}
