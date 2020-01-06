import { Tag, Form, Switch, Layout, Row, Col, Select } from 'antd';
const Option = Select.Option;

import React from 'react';
import { hot } from 'react-hot-loader'
import axios from 'axios';

import { correctness, probDrawing } from './model/model';
import './App.css'


class App extends React.Component {
  constructor(props: any) {
    super(props);
    this.state = {
      marginals: false,
      coefficients: false,
      population: false,
      userAttributes: [],
      attributeOptions: {},
      userData: null
    }
  }

  async componentDidMount() {
    if (!this.state.marginals) {
      const getmarginals = await axios.get('./output_model.json')
      const userAttributes = Object.keys(getmarginals.data.parameters)
      const attributeOptions = {}
      for (var i = 0; i < userAttributes.length; i++) {
        attributeOptions[userAttributes[i]] = Object.keys(getmarginals.data.marginals[userAttributes[i]])
      }
      let stateObject = {
        marginals: getmarginals.data.marginals,
        coefficients: getmarginals.data.parameters,
        population: getmarginals.data.population_size,
        userAttributes: userAttributes,
        attributeOptions: attributeOptions
      }
      for (var i = 0; i < userAttributes.length; i++) {
        stateObject[userAttributes[i]] = attributeOptions[userAttributes[i]][0]
        stateObject[userAttributes[i] + 'Used'] = false
      }
      this.setState(stateObject)
    }
  }

  handleToggle = (prop) => {
    return (enable: boolean) => {
      this.setState({ [prop]: enable });
    };
  }

  handleSelect = (prop) => {
    return (value) => {
      this.setState({ [prop]: value, [prop + 'Used']: true });
    };
  }

  _userObject() {
    let user: Object = {}
    for (var i = 0; i < this.state.userAttributes.length; i++) {
      let attr = this.state.userAttributes[i]
      user[attr] = this.state[attr + 'Used'] ? this.state[attr] : undefined
    }
    return user
  }

  userCorrectness(): number {
    if (!this.state.marginals)
      return NaN

    let user = this._userObject()
    return correctness(this.state.marginals, user, this.state.population, this.state.coefficients)
  }

  numberOfAttributesUsed(): number {
    let attributesUsed: number = 0;
    for (var i = 0; i < this.state.userAttributes.length; i++) {
      let attr = this.state.userAttributes[i];
      attributesUsed += Number(this.state[attr + 'Used'])
    }
    return attributesUsed
  }

  formatteduserCorrectness(): string {
    return Math.round(100 * this.userCorrectness()) + "%"
  }

  formattedMatchingCount(): String {
    if (!this.state.marginals)
      return "Probably only one person"

    let user = this._userObject()
    let pop = this.state.population;
    console.log(user, pop, this.state.coefficients)
    let p = probDrawing(this.state.marginals, user, this.state.coefficients);

    // console.log(p)
    let count = Math.ceil(pop * p)
    // console.log(count)

    return (count == 1) ? "Probably only one person" : `Less than ${count} people`
  }

  render() {
    const state = this.state

    return (
      <Layout className="app" style={{marginTop: "2em"}}>
          <Row type="flex" justify="center" gutter={24}>
            <Col xl={{ span: 6 }} lg={{ span: 12 }} md={{ span: 18 }}>
              <Form layout="vertical" className="compact-user-form">
                {
                  state.userAttributes.map((k, _) => {
                    const v = state.attributeOptions[k]
                    return (
                      <Form.Item key={k} label={
                        <span><Switch checked={state[k + 'Used']} onChange={this.handleToggle(k + 'Used')} /> {k}</span>}>
                        <Select value={state[k]} onChange={this.handleSelect(k)}>
                          {v.map((k_2, _) => <Option key={k_2} value={k_2}>{k_2}</Option>)}
                        </Select>
                      </Form.Item>)
                  })
                }
              </Form>
            </Col>
            <Col xl={{ span: 6 }} lg={{ span: 12 }} md={{ span: 18 }}>
              <h3>{this.formattedMatchingCount()} share these {this.numberOfAttributesUsed()} attributes</h3>
              <p>According to our model, based on these {this.numberOfAttributesUsed()} attributes, you would have <Tag color="#f50">{this.formatteduserCorrectness(false)}</Tag> chance of being correctly identified in any anonymized dataset.</p>
            </Col>
          </Row>
      </Layout>
    )
  }
}

export default hot(module)(App);
