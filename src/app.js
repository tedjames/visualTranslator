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
import Snackbar from 'react-native-snackbar';
import Modal from 'react-native-modalbox';
import Clarifai from 'clarifai'

// Styling
import styles from './styles';
const whiteColor = '#E8EAF6CC';
const transparent = '#00000000';

// API Keys
import apiKeys from '../src/apiKeys.json';
const yandexKey = apiKeys.yandex;

// Yandex - concept translation
const yandexGetLang = `https://translate.yandex.net/api/v1.5/tr.json/getLangs?key=${yandexKey}&ui=en`;
const yandexGetTranslate = `https://translate.yandex.net/api/v1.5/tr.json/translate?key=${yandexKey}`;

// Clarifai - image recognition
const app = new Clarifai.App(apiKeys.clarifai.id, apiKeys.clarifai.secret);


export default class App extends Component {
  constructor(props) {
    super(props);

    const ds = new ListView.DataSource({
      rowHasChanged: (r1 ,r2) => r1 !== r2
    });

    this.state = ({
      loadingVisible: false,
      concepts: '',
      translatedConcept: '',
      translateLang: '',
      isOpen: false,
      swipeToClose: false,
      dataSource: ds.cloneWithRows([])
    });

    this.toggleLoader = this.toggleLoader.bind(this);
    this.getLangList = this.getLangList.bind(this);
    this.setLang = this.setLang.bind(this);
    this.setTextContent = this.setTextContent.bind(this);
    this.loadConcept = this.loadConcept.bind(this);
    this.loadLnConcept = this.loadLnConcept.bind(this);
    this.translateConcept = this.translateConcept.bind(this);
    this.conceptCleanup = this.conceptCleanup.bind(this);
    this.emptyState = this.emptyState.bind(this);
  }

  componentWillMount() {
    this.getLangList();
  }

  componentDidMount() {
    try {
      AsyncStorage.getItem('langCode')
      .then((value) => {
        if (value !== null) {
          this.setState({ translateLang: value });
        } else {
          this.setState({ translateLang: 'hi' });
        }
      });
    } catch (error) {
      alert(error);
    }

    try {
      AsyncStorage.getItem('langName')
      .then((value) => {
        if (value !== null) {
          Snackbar.show({
            title: `Language set to ${value}`,
            duration: Snackbar.LENGTH_SHORT,
          });
        } else {
          this.setLang('hi', 'Hindi'); // Default lanugage
        }
      });
    } catch (error) {
      alert(error);
    }
  }

  setLang(langCode, langName) {
    try {
      AsyncStorage.setItem('langName', langName);
    } catch (error) {
      alert(error);
    }

    try {
      AsyncStorage.setItem('langName', langName);
    } catch (error) {
      alert(error);
    }

    this.setState({ translateLang: langCode });
    this.refs.langs.close();

    Snackbar.show({
      title: `Language set to ${value}`,
      duration: Snackbar.LENGTH_SHORT,
    });
  }

  getLangList() {
    try {
      AsyncStorage.getItem('langsList')
      .then((value) => {
        if (value !== null) {
          this.setState({
            dataSource: this.state.dataSource.cloneWithRows(JSON.parse(value)),
          });
        } else {
          fetch(yandexGetLang)
          .then(res => res.json())
          .then((data) => {
            this.setState({
              dataSource: this.state.dataSource.cloneWithRows(data.langs),
            });
            try {
              AsyncStorage.setItem('langsList', JSON.stringify(data.langs));
            } catch (error) {
              alert(error)
            }
          }).catch(err => alert(err));
        }
      }).done();
    } catch (error) {
      // alert(error)
    }
  }

  setTextContent(concepts) {
    this.setState({
      concepts,
    });
  }

  emptyState() {
    this.setState({
      concepts: '',
      translatedConcept: '',
    });
  }

  // ActivityIndicator toggler
  toggleLoader() {
    this.setState({
      loadingVisible: !this.state.loadingVisible,
    });
  }

  loadConcept() {
    const concept = this.state.concepts;
    return concept
      ? (
        <Text>
          {concept[0].name}{'\n'}
        </Text>
      )
      : '';
  }

  loadOtherConcept() {
    const C = this.state.concepts;
    return C
      ? `${C[1].name}: ${C[1].val}, ${C[2].name}: ${C[2].val}, ${C[3].name}: ${C[3].val}`
      : '';
  }

  loadLnConcept() {
    return this.state.translatedConcept;
  }

  // Tranlate text by using Yandex
  translateConcept(concept) {
    fetch(`${yandexGetTranslate}&text=${concept}&lang=${this.state.translateLang}`)
    .then(res => res.json())
    .then((data) => {
      this.setState({
        translatedConcept: data.text[0],
      });
      this.toggleLoader();
    }).catch(err => alert(err));
  }

  // To remove 'no *****' results from output
  conceptCleanup(concepts) {
    return concepts.filter((concept) => {
      concept.val = concept.val.toString().match(/^-?\d+(?:\.\d{0,2})?/)[0]; // keeping only 2 digits after decimal
      return (!(concept.name.startsWith('no ')));
    });
  }

  // Action on caputuring image
 takePicture() {
   console.log('TAKE PICTURE HANDLER FIRED!');
   this.toggleLoader();
   this.emptyState();

   this.camera.capture()
   .then((image64) => {
     console.log('IMAGE CAPTURED - SENDING TO CLARIFAI');
     app.models.predict(Clarifai.GENERAL_MODEL, { base64: image64.data })
     .then(function (response) {
       console.log('CLARIFAI ANALYSIS COMPLETE');
       const concepts = (response.outputs[0].data.concepts.slice(0, 10))
       .map(concept => ({
         name: concept.name,
         val: concept.value,
       }));

       const cleanConcept = this.conceptCleanup(concepts);
       const conceptToTanslate = cleanConcept[0].name;

       this.translateConcept(conceptToTanslate);
       this.setTextContent(cleanConcept);
     },
     function (err) {
       alert(err);
     });
   }).catch(err => alert(err));
 }

  render() {
    return (
      <View style={styles.container}>

        {/* Fullscreen Camera View */}
        <Camera
          ref={(cam) => {
          this.camera = cam;
          }}
          style={styles.preview}
          aspect={Camera.constants.Aspect.fill}
          type={Camera.constants.Type.back}
          captureMode={Camera.constants.CaptureMode.still}
          captureTarget={Camera.constants.CaptureTarget.memory}
          captureQuality={Camera.constants.CaptureQuality.low}
          playSoundOnCapture={true}>

          {/* Top Icons */}
          <View style={[styles.topIcons]}>
            <View style={[styles.info]}>
              <TouchableOpacity
                onPress={() => {
                this.toggleLoader();
                this.refs.info.open();
                }}
              >
                <Icon
                  name="question-circle-o"
                  size={50}
                  color={this.state.loadingVisible ? transparent : whiteColor}
                />
              </TouchableOpacity>
            </View>

            <View style={[styles.gear]}>
              <TouchableOpacity
                onPress={() => {
                this.toggleLoader();
                this.refs.langs.open();
                }}
              >
                <Icon
                  name="gear"
                  size={50}
                  color={this.state.loadingVisible ? transparent : whiteColor}
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.Concept}>
            <Text style={styles.lnConceptText}>
              {this.loadLnConcept()}
            </Text>
          </View>

          <View style={[{ flex: 1 }]}>
            <ActivityIndicator
              animating={this.state.loadingVisible}
              style={[styles.activityIcon]}
              size="large"
              // color="white"
            />
          </View>

          {/* English concepts */}
          <View style={styles.Concept}>
            <Text style={styles.enConceptText}>
              {this.loadConcept()}
            </Text>
          </View>
          <View style={{ top: 10 }}>
            <Text style={[styles.enConceptText]}>
              <Text style={{ fontSize: 14 }}>
                {this.loadOtherConcept()}
              </Text>
            </Text>
          </View>

          {/* Camera Shoot icon */}
          <View style={[{ height: 70 }]}>
            <TouchableOpacity
              style={[styles.cameraIco, { height: this.state.loadingVisible ? 0 : 72}]}
              onPress={this.takePicture.bind(this)}
            >
              <View>
                <Icon
                  name="eercast"
                  size={70}
                  color={this.state.loadingVisible ? transparent : whiteColor}
                />
              </View>
            </TouchableOpacity>
          </View>

          {/* Language List modal */}
          <Modal
            style={[styles.modal, styles.langs]}
            position={'center'}
            ref={'langs'}
            swipeToClose={this.state.swipeToClose}
            onClosed={this.toggleLoader}
          >

            <ListView
              dataSource={this.state.dataSource}
              renderRow={(rowData, sectionID, rowID) => <View style={styles.listBoxes}>
                <TouchableOpacity
                  onPress={this.setLang.bind(this, rowID, rowData)}
                >
                  <Text style={styles.list}>
                    {rowData}
                  </Text>
                </TouchableOpacity>
              </View>}
            />

          </Modal>

          {/* Info Modal */}
          <Modal
            style={[styles.modal, styles.infoBox]}
            position={'center'}
            ref={'info'}
            swipeToClose={true}
            onClosed={this.toggleLoader}
          >
            <View>
              <Text style={styles.infoText}>
                What The Thing?{'\n\n'}
              </Text>
            </View>
            <View>
              <Text style={[styles.infoText, { fontSize:15 }]}>
                Point camera at things to learn how to say them in a different language{'\n\n'}
              </Text>
            </View>
            <View>
              <Text
                style={[styles.infoText, { fontSize: 15, color: 'blue' }]}
                onPress={() => Linking.openURL('https://github.com/vigzmv/what_the_thing')}
              >
                Github:/vigzmv/what_the_thing
              </Text>
            </View>
          </Modal>

        </Camera>
      </View>
    );
  }
}
