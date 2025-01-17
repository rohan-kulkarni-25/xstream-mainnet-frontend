import { ConnectButton } from "@rainbow-me/rainbowkit";
import React, { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { createClient } from "urql";
import { getTransactionDescription } from "@superfluid-finance/sdk-core";
import ConnectWalletCustom from "../ConnectWalletCustom";
import gif from "../../public/stream-loop.gif";
import avatar1 from "../../public/avatar-image.gif";
import avatar2 from "../../public/avatar2.png";
import avatar3 from "../../public/avatar3.png";
import avatar4 from "../../public/avatar4.png";

import Image from "next/image";

import { sign } from "crypto";
import { ethers } from "ethers";
import { Framework } from "@superfluid-finance/sdk-core";
import ChainSelect from "../ChainSelect";

function Dashboard() {
  const { address, isConnected } = useAccount();
  // const [loading, setLoading] = useState(false);
  const [dropDown, setDropDown] = useState(true);
  const [chain, setChain] = useState("goerli");

  // USESTATE
  const [dropDownAll, setDropDownAll] = useState(true);
  const [dropDownIncoming, setDropDownIncoming] = useState(true);
  const [dropDownOutgoing, setDropDownOutgoing] = useState(true);
  const [allData, setAllData] = useState([]);
  const [incomingData, setIncomingData] = useState([]);
  const [outgoingData, setOutgoingData] = useState([]);
  const [total, setTotal] = useState([]);
  const [balance, setBalane] = useState();
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  // console.log(chain)

  const loadData = async () => {
    if (!address) {
      console.log("false");
      return;
    }

    const APIURL = `https://api.thegraph.com/subgraphs/name/superfluid-finance/protocol-v1-${chain}`;

    const tokensQuery_outgoing = `
    query {
    flowUpdatedEvents(
      where: {sender: "${address}"}
      orderBy: timestamp
    ) {
      timestamp
      sender
      receiver
      flowRate
      totalAmountStreamedUntilTimestamp
      flowOperator
      token
    }
    }
  `;

    const tokensQuery_incoming = `
    query {
    flowUpdatedEvents(
      where: {receiver: "${address}"}
      orderBy: timestamp
    ) {
      timestamp
      sender
      receiver
      flowRate
      totalAmountStreamedUntilTimestamp
      flowOperator
      token
    }
    }
  `;

    const client = createClient({
      url: APIURL,
    });

    const loadedData_outgoing = await client
      .query(tokensQuery_outgoing)
      .toPromise();

    const loadedData_incoming = await client
      .query(tokensQuery_incoming)
      .toPromise();

    const data = loadedData_outgoing.data.flowUpdatedEvents;
    const data1 = loadedData_incoming.data.flowUpdatedEvents;

    total.push([data.length + data1.length, data.length, data1.length]);
    setTotal(total);

    console.log("** DEBUG", loadedData_outgoing);
    console.log("** DEBUG", loadedData_incoming);

    data.sort((a, b) => parseInt(b.timestamp) - parseInt(a.timestamp));
    data1.sort((a, b) => parseInt(b.timestamp) - parseInt(a.timestamp));

    for (let i = 0; i < data.length; i++) {
      if (!outgoingData.find((item) => loadedData_outgoing[0] === item[0])) {
        const d = new Date(parseInt(data[i].timestamp) * 1000);
        const date =
          String(d.getDate()) +
          " " +
          String(monthNames[d.getMonth()]) +
          ". " +
          String(d.getFullYear());
        outgoingData.push([
          data[i].sender,
          data[i].receiver,
          data[i].flowOperator,
          ethers.utils.formatEther(data[i].totalAmountStreamedUntilTimestamp),
          date,
        ]);
        allData.push([
          data[i].receiver,
          data[i].flowOperator,
          ethers.utils.formatEther(data[i].totalAmountStreamedUntilTimestamp),
          date,
          true,
          data[i].timestamp,
        ]);
      }
    }

    for (let i = 0; i < data1.length; i++) {
      if (!incomingData.find((item) => loadedData_incoming[0] === item[0])) {
        const d = new Date(parseInt(data1[i].timestamp) * 1000);
        const date =
          String(d.getDate()) +
          " " +
          String(monthNames[d.getMonth()]) +
          ". " +
          String(d.getFullYear());
        incomingData.push([
          data1[i].sender,
          data1[i].receiver,
          data1[i].flowOperator,
          ethers.utils.formatEther(data1[i].totalAmountStreamedUntilTimestamp),
          date,
        ]);
        allData.push([
          data1[i].sender,
          data1[i].flowOperator,
          ethers.utils.formatEther(data1[i].totalAmountStreamedUntilTimestamp),
          date,
          false,
          data1[i].timestamp,
        ]);
      }
    }
    allData.sort((a, b) => parseInt(b[5]) - parseInt(a[5]));

    setOutgoingData(outgoingData);
    setIncomingData(incomingData);
    setAllData(allData);
  };

  const getBalance = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const account = await signer.getAddress();

        const sf = await Framework.create({
          chainId: 5,
          provider: provider,
        });

        const DAIxContract = await sf.loadSuperToken(
          "0x3427910EBBdABAD8e02823DFe05D34a65564b1a0"
        );
        const DAIx = DAIxContract.address;

        try {
          const b = await DAIxContract.balanceOf({
            account: account,
            providerOrSigner: signer,
          });
          const bal = ethers.utils.formatEther(b);
          setBalane(bal);
        } catch (error) {
          console.error(error);
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    setDropDownAll(true);
    setDropDownIncoming(false);
    setDropDownOutgoing(false);
  }, []);

  useEffect(() => {
    getBalance();
    loadData();
  }, [address, chain]);

  if (isConnected) {
    return (
      <div className="main-container w-full h-screen ">
        <ChainSelect chain={chain} setChain={setChain} />
        <div className="max-w-6xl mx-auto mt-10 rounded-2xl bg-white w-full ">
          <div className="db-box-parent">
            <div className="db-box bg-white rounded-lg">
              <div className="token-details pt-4">
                <table>
                  <thead>
                    <tr>
                      <th>Asset</th>
                      <th>Balance</th>
                      <th>Net Flow</th>
                      <th>Inflow/Outflow</th>
                      <th>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          enableBackground="new 0 0 24 24"
                          height="24px"
                          viewBox="0 0 24 24"
                          width="24px"
                          fill="#000000"
                        >
                          <g>
                            <rect fill="none" height="24" width="24" />
                            <rect fill="none" height="24" width="24" />
                          </g>
                          <g>
                            <g>
                              <path d="M17.29,5.71L17.29,5.71c-0.39-0.39-1.02-0.39-1.41,0L12,9.58L8.11,5.7c-0.39-0.39-1.02-0.39-1.41,0l0,0 c-0.39,0.39-0.39,1.02,0,1.41l4.59,4.59c0.39,0.39,1.02,0.39,1.41,0l4.59-4.59C17.68,6.73,17.68,6.1,17.29,5.71z" />
                              <path d="M17.29,12.3L17.29,12.3c-0.39-0.39-1.02-0.39-1.41,0L12,16.17l-3.88-3.88c-0.39-0.39-1.02-0.39-1.41,0l0,0 c-0.39,0.39-0.39,1.02,0,1.41l4.59,4.59c0.39,0.39,1.02,0.39,1.41,0l4.59-4.59C17.68,13.32,17.68,12.69,17.29,12.3z" />
                            </g>
                          </g>
                        </svg>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        <div className="token-icon">
                          <div aria-label="" className="svg-parent">
                            <svg
                              data-cy="animation"
                              viewBox="0 0 36 36"
                              className="fdaix-token-svg"
                            >
                              <clipPath id="clip">
                                <polygon points="18,18, 30.5,0 36,10.2"></polygon>
                              </clipPath>
                              <mask id="mask">
                                <rect
                                  x="-3"
                                  y="-3"
                                  width="42"
                                  height="42"
                                  fill="white"
                                ></rect>
                                <polygon
                                  points="18,18, 30.5,0 36,10.2"
                                  fill="black"
                                ></polygon>
                              </mask>
                              <circle
                                mask="url(#mask)"
                                r="17.5px"
                                cx="18"
                                cy="18"
                                stroke="#10BB35FF"
                                stroke-width="1"
                                fill="transparent"
                              ></circle>
                              <circle
                                clipPath="url(#clip)"
                                r="17px"
                                cx="18"
                                cy="18"
                                strokeDasharray="2"
                                stroke="#10BB35FF"
                                stroke-width="2"
                                fill="transparent"
                              ></circle>
                            </svg>
                            <div
                              class="MuiAvatar-root MuiAvatar-circular token-avatar-parent"
                              data-cy="token-icon"
                            >
                              <img
                                alt="TESTx token icon"
                                src="https://raw.githubusercontent.com/superfluid-finance/assets/master/public//tokens/dai/icon.svg"
                                class="MuiAvatar-img avatar-token"
                              />
                            </div>
                          </div>
                          <h4 className="fdaix">TESTx</h4>
                        </div>
                      </td>
                      <td>
                        <h4 className="token-balance">{balance}</h4>
                      </td>
                      <td>-</td>
                      <td>-</td>
                      <td>
                        <div
                          className="parent-drop-down"
                          onClick={() => {
                            // loadData();
                            // setDropDown(!dropDown);
                            // setDropDownAll(!dropDownAll);
                          }}
                        >
                          <svg
                            class={
                              dropDown
                                ? "drop-down-svg active"
                                : "drop-down-svg"
                            }
                            focusable="false"
                            aria-hidden="true"
                            viewBox="0 0 24 24"
                            data-testid="ExpandCircleDownOutlinedIcon"
                          >
                            <path d="M15.08 9.59 12 12.67 8.92 9.59 7.5 11l4.5 4.5 4.5-4.5-1.42-1.41zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"></path>
                          </svg>
                        </div>
                      </td>
                    </tr>

                    <tr>
                      <td colSpan={5} className="dropdown-table-td">
                        <div>
                          <table className="dropdown-table">
                            <thead>
                              <tr>
                                <td colSpan={6} className="dropdown-table-td">
                                  <div className="dropdown-row">
                                    <div className="dropdown-btn-parent">
                                      <button
                                        className={dropDownAll ? "active" : ""}
                                        onClick={() => {
                                          setDropDownAll(true);
                                          setDropDownIncoming(false);
                                          setDropDownOutgoing(false);
                                        }}
                                      >
                                        {total.length > 0
                                          ? "All (" + total[0][0] + ")"
                                          : "All"}
                                      </button>
                                      <button
                                        className={
                                          dropDownIncoming ? "active" : ""
                                        }
                                        onClick={() => {
                                          setDropDownAll(false);
                                          setDropDownIncoming(true);
                                          setDropDownOutgoing(false);
                                        }}
                                      >
                                        {total.length > 0
                                          ? "Incoming (" + total[0][2] + ")"
                                          : "Incoming"}
                                      </button>
                                      <button
                                        className={
                                          dropDownOutgoing ? "active" : ""
                                        }
                                        onClick={() => {
                                          setDropDownAll(false);
                                          setDropDownIncoming(false);
                                          setDropDownOutgoing(true);
                                        }}
                                      >
                                        {total.length > 0
                                          ? "Outgoing (" + total[0][1] + ")"
                                          : "Outgoing"}
                                      </button>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                              <tr>
                                <th>To / From</th>
                                <th>All Time Flow</th>
                                <th>Flow Rate</th>
                                <th>Flow Operator</th>
                                <th>Start / End Date</th>
                                <th></th>
                              </tr>
                            </thead>
                            <tbody>
                              {/**************all flow data************/}
                              {dropDownAll &&
                                allData?.map((item, key) => {
                                  return (
                                    <tr key={key}>
                                      <td>
                                        {item[4] ? (
                                          <h6>
                                            -&gt;&nbsp;{item[0].slice(0, 5)}
                                            ...
                                            {item[0].slice(38, 42)}
                                          </h6>
                                        ) : (
                                          <h6>
                                            &lt;-&nbsp;{item[0].slice(0, 5)}
                                            ...
                                            {item[0].slice(38, 42)}
                                          </h6>
                                        )}
                                      </td>
                                      <td>{item[2]}</td>
                                      <td>-</td>
                                      <td>
                                        {item[1].slice(0, 5)}...
                                        {item[1].slice(38, 42)}
                                      </td>
                                      <td>{item[3]}</td>
                                    </tr>
                                  );
                                })}
                              {/**************outgoing flow data************/}
                              {dropDownOutgoing &&
                                outgoingData?.map((item, key) => {
                                  return (
                                    <tr key={key}>
                                      <td>
                                        -&gt;&nbsp;
                                        {item[1].slice(0, 5)}...
                                        {item[1].slice(38, 42)}
                                      </td>
                                      <td>{item[3]}</td>
                                      <td>-</td>
                                      <td>
                                        {item[2].slice(0, 5)}...
                                        {item[2].slice(38, 42)}
                                      </td>
                                      <td>{item[4]}</td>
                                    </tr>
                                  );
                                })}
                              {/**************incoming flow data************/}
                              {dropDownIncoming &&
                                incomingData?.map((item, key) => {
                                  return (
                                    <tr key={key}>
                                      <td>
                                        &lt;-&nbsp;
                                        {item[0].slice(0, 5)}...
                                        {item[0].slice(38, 42)}
                                      </td>
                                      <td>{item[3]}</td>
                                      <td>-</td>
                                      <td>
                                        {item[2].slice(0, 5)}...
                                        {item[2].slice(38, 42)}
                                      </td>
                                      <td>{item[4]}</td>
                                    </tr>
                                  );
                                })}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="db-main">
      <div className="db-sub">
        <h1>Connect to XStream</h1>
        <p>Connect your wallet or take a look around!</p>
        <div className="db-grid-sub w-[70%] mx-auto my-0">
          <div className="grid-sub min-h-[170px]">
            <span className="grid-sub-title">Controll Your Stream</span>
            <span className="grid-sub-info">
              Controll stream on a crosschain level
            </span>
            <div className="flex items-center justify-center mt-4">
              <div className="shadow-[#cccccc40] shadow-[0px_0px_6px_3px_rgb(204,204,204,0.25)] flex items-center justify-between w-30 px-1 py-1 rounded-xl">
                <Image
                  src={avatar1}
                  alt="send stream image"
                  className="w-8 p-1 rounded-xl"
                />
                <div className="flex flex-col w-20 rounded-xl p-1 ">
                  <div className="bg-[#12141e1c] h-2 w-full content-none mb-1 rounded-lg"></div>
                  <div className="bg-[#12141e1c] h-2 w-1/2 content-none rounded-lg"></div>
                </div>
              </div>
              <span className="p-[6px] bg-[#10bb3514] rounded-xl mx-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  enableBackground="new 0 0 24 24"
                  height="24px"
                  viewBox="0 0 24 24"
                  width="24px"
                  className="fill-[#10bb35]"
                >
                  <g>
                    <rect fill="none" height="24" width="24" />
                    <rect fill="none" height="24" width="24" />
                  </g>
                  <g>
                    <g>
                      <path
                        d="M20,3H4C2.9,3,2,3.9,2,5v14c0,1.1,0.9,2,2,2h16c1.1,0,2-0.9,2-2V5 C22,3.9,21.1,3,20,3z M9,17H6c-0.55,0-1-0.45-1-1c0-0.55,0.45-1,1-1h3c0.55,0,1,0.45,1,1C10,16.55,9.55,17,9,17z M9,13H6 c-0.55,0-1-0.45-1-1c0-0.55,0.45-1,1-1h3c0.55,0,1,0.45,1,1C10,12.55,9.55,13,9,13z M9,9H6C5.45,9,5,8.55,5,8c0-0.55,0.45-1,1-1h3 c0.55,0,1,0.45,1,1C10,8.55,9.55,9,9,9z M18.7,11.12l-3.17,3.17c-0.39,0.39-1.03,0.39-1.42,0l-1.41-1.42 c-0.39-0.39-0.39-1.02,0-1.41c0.39-0.39,1.02-0.39,1.41,0l0.71,0.71l2.47-2.47c0.39-0.39,1.02-0.39,1.41,0l0.01,0.01 C19.09,10.1,19.09,10.74,18.7,11.12z"
                        fill-rule="evenodd"
                      />
                    </g>
                  </g>
                </svg>
              </span>
              <div className=" shadow-[#cccccc40] shadow-xl flex items-center justify-between w-30 px-1 py-1 rounded-xl">
                <Image
                  src={avatar2}
                  alt="send stream image"
                  className="w-8 p-1 rounded-xl"
                />
                <div className="flex flex-col w-20 rounded-xl p-1 ">
                  <div className="bg-[#12141e1c] h-2 w-full content-none mb-1 rounded-xl"></div>
                  <div className="bg-[#12141e1c] h-2 w-1/2 content-none rounded-xl"></div>
                </div>
              </div>
            </div>
          </div>
          <div className="grid-sub min-h-[120px]">
            <span className="grid-sub-title">One Click Stream</span>
            <span className="grid-sub-info">
              Hassle less stream with one click
            </span>
            <div className="flex items-center justify-center mt-4">
              <span className="mr-2 p-[6px] bg-[#10bb3514] rounded-xl">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  enableBackground="new 0 0 24 24"
                  height="24px"
                  viewBox="0 0 24 24"
                  width="24px"
                  className="fill-[#10bb35]"
                >
                  <g>
                    <rect fill="none" height="24" width="24" />
                    <rect fill="none" height="24" width="24" />
                  </g>
                  <g>
                    <path d="M23,12l-2.44-2.79l0.34-3.69l-3.61-0.82L15.4,1.5L12,2.96L8.6,1.5L6.71,4.69L3.1,5.5L3.44,9.2L1,12l2.44,2.79l-0.34,3.7 l3.61,0.82L8.6,22.5l3.4-1.47l3.4,1.46l1.89-3.19l3.61-0.82l-0.34-3.69L23,12z M9.38,16.01L7,13.61c-0.39-0.39-0.39-1.02,0-1.41 l0.07-0.07c0.39-0.39,1.03-0.39,1.42,0l1.61,1.62l5.15-5.16c0.39-0.39,1.03-0.39,1.42,0l0.07,0.07c0.39,0.39,0.39,1.02,0,1.41 l-5.92,5.94C10.41,16.4,9.78,16.4,9.38,16.01z" />
                  </g>
                </svg>
              </span>
              <div className=" shadow-[#cccccc40] shadow-xl flex items-center justify-between w-30 px-1 py-1 rounded-xl">
                <Image
                  src={avatar2}
                  alt="send stream image"
                  className="w-8 p-1 rounded-xl"
                />
                <div className="flex flex-col w-20 rounded-xl p-1 ">
                  <div className="bg-[#12141e1c] h-2 w-full content-none mb-1 rounded-xl"></div>
                  <div className="bg-[#12141e1c] h-2 w-1/2 content-none rounded-xl"></div>
                </div>
              </div>
            </div>
          </div>
          <div className="grid-sub min-h-[120px]">
            <span className="grid-sub-title">Get Notified</span>
            <span className="grid-sub-info">
              Get notified when your stream is live
            </span>
            <div className="flex items-center justify-center mt-4">
              <span className="mr-2 p-[6px] bg-[#d2252514] rounded-xl">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  enableBackground="new 0 0 24 24"
                  height="24px"
                  viewBox="0 0 24 24"
                  width="24px"
                  className="fill-[#10bb35]"
                >
                  <g>
                    <rect fill="none" height="24" width="24" />
                    <rect fill="none" height="24" width="24" />
                  </g>
                  <g>
                    <path d="M23,12l-2.44-2.79l0.34-3.69l-3.61-0.82L15.4,1.5L12,2.96L8.6,1.5L6.71,4.69L3.1,5.5L3.44,9.2L1,12l2.44,2.79l-0.34,3.7 l3.61,0.82L8.6,22.5l3.4-1.47l3.4,1.46l1.89-3.19l3.61-0.82l-0.34-3.69L23,12z M9.38,16.01L7,13.61c-0.39-0.39-0.39-1.02,0-1.41 l0.07-0.07c0.39-0.39,1.03-0.39,1.42,0l1.61,1.62l5.15-5.16c0.39-0.39,1.03-0.39,1.42,0l0.07,0.07c0.39,0.39,0.39,1.02,0,1.41 l-5.92,5.94C10.41,16.4,9.78,16.4,9.38,16.01z" />
                  </g>
                </svg>
              </span>
              <div className=" shadow-[#cccccc40] shadow-xl flex justify-between w-30 px-1 py-1 rounded-xl">
                <Image
                  src={avatar3}
                  alt="send stream image"
                  className="w-8 p-1 rounded-xl"
                />
                <div className="flex flex-col w-20 rounded-xl p-1 ">
                  <div className="bg-[#12141e1c] h-2 w-full content-none mb-1 rounded-xl"></div>
                  <div className="bg-[#12141e1c] h-2 w-1/2 content-none rounded-xl"></div>
                </div>
              </div>
            </div>
          </div>
          <div className="grid-sub min-h-[120px]">
            <span className="grid-sub-title">Send a XStream</span>
            <span className="grid-sub-info">
              Pick a Sender, Recipient, Token and Network on a differnt chain
            </span>
            <div className="flex items-center justify-center mt-4">
              <div className="shadow-[#cccccc40] shadow-xl flex justify-between w-30 px-1 py-1 rounded-xl">
                <Image
                  src={avatar1}
                  alt="send stream image"
                  className="w-8 p-1 rounded-xl"
                />
                <div className="flex flex-col w-20 rounded-xl p-1 ">
                  <div className="bg-[#12141e1c] h-2 w-full content-none mb-1 rounded-xl"></div>
                  <div className="bg-[#12141e1c] h-2 w-1/2 content-none rounded-xl"></div>
                </div>
              </div>
              <span>
                <Image src={gif} alt="send stream image" className="w-8" />
              </span>
              <div className=" shadow-[#cccccc40] shadow-xl flex justify-between w-30 px-1 py-1 rounded-xl">
                <Image
                  src={avatar4}
                  alt="send stream image"
                  className="w-8 p-1 rounded-xl"
                />
                <div className="flex flex-col w-20 rounded-xl p-1 ">
                  <div className="bg-[#12141e1c] h-2 w-full content-none mb-1 rounded-xl"></div>
                  <div className="bg-[#12141e1c] h-2 w-1/2 content-none rounded-xl"></div>
                </div>
              </div>
            </div>
          </div>
          <div className="grid-sub min-h-[120px]">
            <span className="grid-sub-title">Modify and Cancle Streams</span>
            <span className="grid-sub-info">
              Update Flow Rate and Delete a Stream using Operator Control
            </span>
            <div className="flex items-center justify-center mt-4">
              <button className="p-[6px] bg-[#10bb3514] rounded-xl">
                <svg
                  className="fill-[#10bb35] w-6"
                  focusable="false"
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  data-testid="EditIcon"
                >
                  <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.9959.9959 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"></path>
                </svg>
              </button>
              <button className="p-[6px] bg-[#d2252514] rounded-xl ml-3">
                <svg
                  className="fill-[#d22525] w-6"
                  focusable="false"
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  data-testid="CancelIcon"
                >
                  <path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z"></path>
                </svg>
              </button>
            </div>
          </div>
          <div className="grid-sub min-h-[120px]">
            <span className="grid-sub-title">View Streams</span>
            <span className="grid-sub-info">
              View All Streams and their details
            </span>
            <div className="flex items-center justify-center mt-4 px-2">
              <div className=" shadow-[#cccccc40] shadow-xl flex items-center justify-between w-25 px-1 py-1 rounded-xl">
                <Image
                  src={avatar2}
                  alt="send stream image"
                  className="w-8 p-1 rounded-xl"
                />
                <div className="flex flex-col w-20 rounded-xl p-1 ">
                  <div className="bg-[#12141e1c] h-2 w-full content-none rounded-xl mb-1"></div>
                  <div className="bg-[#12141e1c] h-2 w-1/2 content-none rounded-xl"></div>
                </div>
              </div>
              <span className="ml-2 p-[6px] bg-[#10bb3514] rounded-xl">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  enableBackground="new 0 0 24 24"
                  height="24px"
                  viewBox="0 0 24 24"
                  width="24px"
                  className="fill-[#10bb35]"
                >
                  <g>
                    <rect fill="none" height="24" width="24" />
                    <rect fill="none" height="24" width="24" />
                  </g>
                  <g>
                    <g>
                      <path d="M17,11c0.34,0,0.67,0.04,1,0.09V7.58c0-0.8-0.47-1.52-1.2-1.83l-5.5-2.4c-0.51-0.22-1.09-0.22-1.6,0l-5.5,2.4 C3.47,6.07,3,6.79,3,7.58v3.6c0,4.54,3.2,8.79,7.5,9.82c0.55-0.13,1.08-0.32,1.6-0.55C11.41,19.47,11,18.28,11,17 C11,13.69,13.69,11,17,11z" />
                      <path d="M17,13c-2.21,0-4,1.79-4,4c0,2.21,1.79,4,4,4s4-1.79,4-4C21,14.79,19.21,13,17,13z M17,14.38c0.62,0,1.12,0.51,1.12,1.12 s-0.51,1.12-1.12,1.12s-1.12-0.51-1.12-1.12S16.38,14.38,17,14.38z M17,19.75c-0.93,0-1.74-0.46-2.24-1.17 c0.05-0.72,1.51-1.08,2.24-1.08s2.19,0.36,2.24,1.08C18.74,19.29,17.93,19.75,17,19.75z" />
                    </g>
                  </g>
                </svg>
              </span>
            </div>
          </div>
        </div>
        <div className="custom-wallet w-80 mx-auto my-8">
          <ConnectWalletCustom />
        </div>
      </div>
    </div>
  );
}

export default Dashboard;

// UNWANDTED CODE
{
  /* <button onClick={() => loadData()}>click</button> */
}
{
  /* <p>Connect your wallet, view any wallet, or take a look around!</p> */
}

{
  /* <h1 className="super-token">"Super Token"</h1> */
}
// const APIURL = `https://api.thegraph.com/subgraphs/name/superfluid-finance/protocol-v1-mumbai`;

// Array.prototype.push.apply(data2, data1);
// data2.sort((a, b) => parseInt(b.timestamp) - parseInt(a.timestamp));
// console.log(data2);
// console.log(outgoingData);
// console.log(incomingData);
// console.log(allData);
