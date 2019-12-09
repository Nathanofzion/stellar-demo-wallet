declare const StellarSdk: any

import { Component, State, Host, h } from '@stencil/core'
import copy from 'copy-to-clipboard'
import sjcl from 'sjcl'
import { Prompt } from '../prompt-modal/prompt-modal'

interface Account {
  publicKey: string,
  keystore: string
}

@Component({
  tag: 'stellar-demo-wallet',
  styleUrl: 'demo-wallet.scss',
  shadow: true
})
export class DemoWallet {
  @State() account: Account
  @State() prompt: Prompt = {show: false}

  componentWillRender() {
    return new Promise((resolve) => {
      if (globalThis.StellarSdk)
        resolve()
      else {
        const script = document.createElement('script')
              script.src = 'https://cdn.jsdelivr.net/npm/stellar-sdk@latest/dist/stellar-sdk.min.js'

        document.body.appendChild(script)

        script.addEventListener('load', () => resolve())
      }
    })
  }

  componentWillLoad() {
    const keystore = localStorage.hasOwnProperty('KEYSTORE') ? atob(localStorage.getItem('KEYSTORE')) : null

    if (!keystore)
      return

    const { publicKey } = JSON.parse(atob(JSON.parse(keystore).adata))

    this.account = {
      publicKey,
      keystore
    }
  }

  async createAccount(e: Event) {
    e.preventDefault()

    const pincode = await this.setPrompt('Enter a keystore pincode')

    if (!pincode)
      return

    const keypair = StellarSdk.Keypair.random()

    this.account = {
      publicKey: keypair.publicKey(),
      keystore: sjcl.encrypt(pincode, keypair.secret(), {
        adata: JSON.stringify({
          publicKey: keypair.publicKey()
        })
      })
    }
    
    localStorage.setItem('KEYSTORE', btoa(this.account.keystore))
  }

  async copySecret(e: Event) {
    e.preventDefault()

    const pincode = await this.setPrompt('Enter your keystore pincode')

    if (!pincode)
      return

    const secret = sjcl.decrypt(pincode, this.account.keystore)
    copy(secret)
  }

  setPrompt(
    message: string = null,
    placeholder: string = null
  ) {
    this.prompt = {
      ...this.prompt, 
      show: true,
      message,
      placeholder
    }

    return new Promise((resolve, reject) => { 
      this.prompt.resolve = resolve
      this.prompt.reject = reject
    })
  }

  render() {
    return (
      <Host>
        <stellar-prompt-modal prompt={this.prompt} />
        <form>
          {
            this.account 
            ? [
              <p>{this.account.publicKey}</p>,
              <button type="button" onClick={(e) => this.copySecret(e)}>Copy Secret</button>
            ] 
            : <button type="button" onClick={(e) => this.createAccount(e)}>Create Account</button>
          }
        </form>
      </Host>
    )
  }
}
