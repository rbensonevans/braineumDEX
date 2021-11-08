/** Connect to Moralis server */

/* TestNet 
const testNetServerUrl = "https://o39ilg8cqfcv.usemoralis.com:2053/server";
const testNetAppId = "L5amN5upF4XCjd9VREfR1CRsNezJizZQQ5IBJPlk";
Moralis.initialize(testNetAppId);
Moralis.serverURL = testNetServerUrl;
*/

/* MainNet */
const mainNetServerUrl = "https://w27tp3u1v7zo.moralishost.com:2053/server";
const mainNetAppId = "7KDGDCxHgQVBucEJvztp30I638w9ik3JsG3C4rKC";
Moralis.initialize(mainNetAppId);
Moralis.serverURL = mainNetServerUrl;


/** Add from here down */
let currentTrade = {};
let currentSelectSide;
let tokens;

async function init() {
    await Moralis.initPlugins();
    await Moralis.enableWeb3();
    await listAvailableTokens();
    currentUser = Moralis.User.current();
    if (currentUser) {
        document.getElementById("swap_button").disabled = false;
    }
}


async function listAvailableTokens(){

    const result = await Moralis.Plugins.oneInch.getSupportedTokens({
        chain: 'eth', // The blockchain you want to use (eth/bsc/polygon)
      });
      console.log(result);

      tokens = result.tokens;
      let parent = document.getElementById("token_list");

      for (const address in tokens) {
          let token = tokens[address];
          let div = document.createElement("div");
          div.setAttribute("data-address", address)
          div.className = "token_row";

          let html = `
          <img class="token_list_img" src="${token.logoURI}">
          <span class="token_list_text">${token.symbol}</span>
          <span class="token_list_name" style="font-size:0.8em">${token.name}</span>
          `

          div.innerHTML = html;
          div.onclick = (() => {selectToken(address)});
          parent.appendChild(div);
      }
    }

function selectToken(address){
    closeModal();
    //console.log(address);
    currentTrade[currentSelectSide] = tokens[address];
    //console.log(currentTrade);
    renderInterface();
    getQuote();
}

function renderInterface(){
    if (currentTrade.from){
        document.getElementById("from_token_img").src = currentTrade.from.logoURI;
        document.getElementById("from_token_text").innerHTML = currentTrade.from.symbol;
    }

    if (currentTrade.to){
        document.getElementById("to_token_img").src = currentTrade.to.logoURI;
        document.getElementById("to_token_text").innerHTML = currentTrade.to.symbol;
    }
}

async function login() {
   try {
        currentUser = Moralis.User.current();
        if (!currentUser) {
            currentUser = await Moralis.Web3.authenticate();
        }
        document.getElementById("swap_button").disabled = false;
   } catch (error) {
       console.log(error);
   }
}

async function logOut() {
  await Moralis.User.logOut();
  console.log("logged out");
}

function openModal(side){
    currentSelectSide = side;
    document.getElementById("token_modal").style.display = "block";
}

function closeModal(){
    document.getElementById("token_modal").style.display = "none";
}

async function getQuote(){
    if (!currentTrade.from || !currentTrade.to || !document.getElementById("from_amount").value) return;
    
    let amount = Number(document.getElementById("from_amount").value * 10**currentTrade.from.decimals);

    const quote = await Moralis.Plugins.oneInch.quote({
        chain: 'eth', // The blockchain you want to use (eth/bsc/polygon)
        fromTokenAddress: currentTrade.from.address, // The token you want to swap
        toTokenAddress: currentTrade.to.address, // The token you want to receive
        amount: amount,
      });
      console.log(quote);
      document.getElementById("gas_estimate").innerHTML = quote.estimatedGas;
      // bug??? document.getElementById("to_amount").value = quote.toTokenAmount / (10**currentTrade.toToken.decimals);
      document.getElementById("to_amount").value = Number(quote.toTokenAmount) / (10**quote.toToken.decimals);
}

async function trySwap(){
    let address = Moralis.User.current().get("ethAddress");
    let amount = Number(document.getElementById("from_amount").value * 10**currentTrade.from.decimals);

    if (currentTrade.from.symbol !== "ETH") {
        const allowance = await Moralis.Plugins.oneInch.hasAllowance({
            chain: 'eth', // The blockchain you want to use (eth/bsc/polygon)
            fromTokenAddress: currentTrade.from.address, // The token you want to swap
            fromAddress: address, // Your wallet address
            amount: amount,
          });
          console.log(allowance);
          if (!allowance){
            await Moralis.Plugins.oneInch.approve({
                chain: 'eth', // The blockchain you want to use (eth/bsc/polygon)
                tokenAddress: currentTrade.from.address, // The token you want to swap
                fromAddress: address, // Your wallet address
              });
          }
    }
    let receipt = await doSwap(address, amount);
    alert("Swap Complete");
}

function doSwap(userAddress, amount){
    return Moralis.Plugins.oneInch.swap({
        chain: 'eth', // The blockchain you want to use (eth/bsc/polygon)
        fromTokenAddress: currentTrade.from.address, // The token you want to swap
        toTokenAddress: currentTrade.to.address, // The token you want to receive
        amount: amount,
        fromAddress: userAddress, // Your wallet address
        slippage: 1,
      });
}

init();


document.getElementById("modal_close").onclick = closeModal;
document.getElementById("from_token_select").onclick = (() => {openModal("from")});
document.getElementById("to_token_select").onclick = (() => {openModal("to")});
document.getElementById("login_button").onclick = login;
document.getElementById("from_amount").onblur = getQuote;
document.getElementById("swap_button").onclick = trySwap;

//document.getElementById("btn-logout").onclick = logOut

//if (document.querySelector('#display-organizer-link') != null) {
  //  document.querySelector('#display-organizer-link').onclick = displayOrganizer;
//}

/* 

Future: use the method used by BraineumDAO to switch screens.

displayOrganizer = async () => {
    console.log('display-organizer-link clicked');
    //let displayOrganizerLink = document.querySelector("#DisplayOrganizerLink");
    let displayOrganizerLink = document.querySelector("#DisplayPageLink");
    let displayOrganizerHeading= document.querySelector("#DisplayPageHeading");
    displayOrganizerHeading.innerHTML = "OrganizerDAO";
    let content = `
        <h3>Not yet implemented</h3>
    `
    displayOrganizerLink.innerHTML = content;

}

if (document.querySelector('#display-displayrealworldassets-link') != null) {
    document.querySelector('#display-displayrealworldassets-link').onclick = displayOrganizer;
}

*/