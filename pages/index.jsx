import { getSession, signIn, signOut } from 'next-auth/react'
import React, { useRef, forwardRef, useEffect, useState } from 'react'
import { FcGoogle } from 'react-icons/fc'
import ReactToPrint, { PrintContextConsumer } from 'react-to-print'
import { db } from '../fb/Firebase'
import Loading from '../components/Loading'
import toast, { Toaster } from 'react-hot-toast'
import {
  doc,
  getDoc,
  deleteDoc,
  getDocs,
  query,
  limit,
  collection,
  setDoc,
  arrayUnion,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { parse, format, getDay } from 'date-fns'
import previousSunday from 'date-fns/previousSunday'
import { HiOutlineLightBulb, HiTrash } from 'react-icons/hi'
import pbronze from '../public/static/problems/bronze.json'
import psilver from '../public/static/problems/silver.json'
import pgold from '../public/static/problems/gold.json'
import pplat from '../public/static/problems/plat.json'
import { SiStarship } from 'react-icons/si'
import { FaCalendarWeek, FaShareAlt } from 'react-icons/fa'
import { HiBadgeCheck } from 'react-icons/hi'
import { BsPrinterFill } from 'react-icons/bs'
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'
import Tippy from '@tippyjs/react'
import 'tippy.js/dist/tippy.css'
import 'tippy.js/themes/light-border.css'

export default function Home({ session, name, id, o_blist }) {
  const compref = useRef()
  const [isLoading, setLoading] = useState(session ? 10 : -1)
  const [today, setToday] = useState('')
  const [sun, setSun] = useState('')
  const [qry, setQry] = useState({
    div: 'all',
    tag: 'all',
    tags: Object.values(pplat[0], pgold[0], psilver[0], pbronze[0]),
  })
  const [prob, setProb] = useState({
    name: 'x',
    url: null,
    probs: [],
  })
  const [blist, setBlist] = useState(o_blist ? o_blist : [])
  const [itms, setItms] = useState([])
  const [copy, setCopy] = useState('share!')

  const changeCopy = () => {
    setCopy('link copied!')

    navigator.clipboard.writeText(window.location.origin + '/unite/' + id)

    // delay after copy
    setTimeout(() => {
      setCopy('share!')
    }, 1500)
  }

  const pageStyle = `
    @media all {
      .hides {
        display: none;
      }
    }
  `

  const newWeek = () => toast.success('welcome to a new week!')

  const [cols, setCols] = useState({})
  const [veri, setVeri] = useState("solved? (don't show again)")

  const get_problems = () => {
    const get_div = (pdiv) => {
      for (var j = 1; j < pdiv.length; j++) {
        const p_id = pdiv[j].url.split('=')[pdiv[j].url.split('=').length - 1]
        if (
          (qry.tag == 'all' || pdiv[j].tags.indexOf(qry.tag) != -1) &&
          blist.indexOf(pdiv[j].name) == -1 &&
          partOf(itms, { id: pdiv[j].name, content: p_id }) == -1
        ) {
          setProb((prev_prob) => ({
            ...prev_prob,
            probs: [
              ...prev_prob.probs,
              { name: pdiv[j].name, url: pdiv[j].url },
            ],
          }))
        }
      }
    }

    const partOf = (jwu, fwu) => {
      for (var i = 0; i < jwu.length; i++) {
        if (
          jwu[i] &&
          Object.entries(jwu[i]).toString() === Object.entries(fwu).toString()
        ) {
          return i
        }
      }

      return -1
    }
    if (cols['atmp'].items.length) {
      const fdk = [...itms]

      const dk_id = cols['atmp'].items[0].id
      const dk_ct = cols['atmp'].items[0].content
      fdk[partOf(itms, { id: dk_id, content: dk_ct })] = null
      setItms(fdk)
    }

    setProb({
      ...prob,
      probs: [],
    })
    // TODO: add check for dismissed problems
    if (qry.div == 'bronze' || qry.div == 'all') {
      get_div(pbronze)
    }
    if (qry.div == 'silver' || qry.div == 'all') {
      get_div(psilver)
    }
    if (qry.div == 'gold' || qry.div == 'all') {
      get_div(pgold)
    }
    if (qry.div == 'plat' || qry.div == 'all') {
      get_div(pplat)
    }

    const rnd = Math.random()

    setProb((prevState, props) => ({
      ...prevState,
      name:
        prevState.probs[Math.floor(rnd * prevState.probs.length)] &&
        prevState.probs.length
          ? prevState.probs[Math.floor(rnd * prevState.probs.length)].name
          : 'no more problems with these filters -W- | good job!!',
      url:
        prevState.probs[Math.floor(rnd * prevState.probs.length)] &&
        prevState.probs.length
          ? prevState.probs[Math.floor(rnd * prevState.probs.length)].url
          : 'https://www.youtube.com/watch?v=yKQ_sQKBASM',
    }))
  }

  useEffect(() => {
    if (
      prob.name != 'x' &&
      prob.name != 'no more problems with these filters -W- | good job!!'
    ) {
      const k = prob.url.split('=')
      setItms([
        ...itms,
        {
          id: prob.name,
          content: k[k.length - 1],
        },
      ])
      setCols({
        ...cols,
        atmp: {
          title: 'problem:',
          content: 'serotonin',
          items: [
            {
              id: prob.name,
              content: k[k.length - 1],
            },
          ],
        },
      })
    }
  }, [prob.name, prob.url])

  const getDays = (ms) => {
    return Math.ceil(ms / (24 * 60 * 60 * 1000))
  }
  const parsify = (sdt) => {
    return parse(sdt, 'MM-dd-yyyy', new Date())
  }

  const blacklist = () => {
    setVeri('removed!')
    getDoc(doc(db, 'data', id, 'blacklist', 'contents')).then((snp) => {
      if (snp.exists()) {
        updateDoc(doc(db, 'data', id, 'blacklist', 'contents'), {
          lt: arrayUnion(prob.name),
        }).then((snp) => {
          setBlist((prv) => [...prv, prob.name])
        })
      } else {
        setDoc(doc(db, 'data', id, 'blacklist', 'contents'), {
          lt: [prob.name],
        }).then((snp) => {
          setBlist((prv) => [...prv, prob.name])
        })
      }
    })
    setTimeout(() => {
      setVeri("solved? (don't show again)")
    }, 1500)
  }

  const divChange = (e) => {
    if (e.target.innerHTML == 'bronze') {
      setQry((qry) => ({
        ...qry,
        div: e.target.innerHTML,
        tags: Object.values(pbronze[0]),
        tag: 'all',
      }))
    } else if (e.target.innerHTML == 'silver') {
      setQry((qry) => ({
        ...qry,
        div: e.target.innerHTML,
        tags: Object.values(psilver[0]),
        tag: 'all',
      }))
    } else if (e.target.innerHTML == 'gold') {
      setQry((qry) => ({
        ...qry,
        div: e.target.innerHTML,
        tags: Object.values(pgold[0]),
        tag: 'all',
      }))
    } else if (e.target.innerHTML == 'plat') {
      setQry((qry) => ({
        ...qry,
        div: e.target.innerHTML,
        tags: Object.values(pplat[0]),
        tag: 'all',
      }))
    } else {
      setQry((qry) => ({
        ...qry,
        div: e.target.innerHTML,
        tags: Object.values(pplat[0], pgold[0], psilver[0], pbronze[0]),
        tag: 'all',
      }))
    }
  }

  const tagChange = (e) => {
    setQry((qry) => ({
      ...qry,
      tag: e.target.innerHTML,
    }))
  }

  const dragfin = (res) => {
    if (!res.destination) return

    const { source, destination } = res
    if (source.droppableId != destination.droppableId) {
      const sourcecol = cols[source.droppableId]
      const destinationcol = cols[destination.droppableId]
      if (destinationcol.title != 'problem:') {
        const sourcev = [...sourcecol.items]
        const destinationv = [...destinationcol.items]

        const [removed] = sourcev.splice(source.index, 1)
        destinationv.splice(destination.index, 0, removed)
        setCols({
          ...cols,
          [source.droppableId]: {
            ...sourcecol,
            items: sourcev,
          },
          [destination.droppableId]: {
            ...destinationcol,
            items: destinationv,
          },
        })
        setDoc(doc(db, 'data', id, 'cur', sun), {
          columns: {
            ...cols,
            [source.droppableId]: {
              ...sourcecol,
              items: sourcev,
            },
            [destination.droppableId]: {
              ...destinationcol,
              items: destinationv,
            },
          },
          items: itms,
          serverTime: serverTimestamp(),
        })
      } else {
        const col = cols[source.droppableId]
        const cp = [...col.items]
        const [rem] = cp.splice(source.index, 1)
        cp.splice(destination.index, 0, rem)

        setCols({
          ...cols,
          [source.droppableId]: {
            ...col,
            items: cp,
          },
        })

        setDoc(doc(db, 'data', id, 'cur', sun), {
          columns: {
            ...cols,
            [source.droppableId]: {
              ...col,
              items: cp,
            },
          },
          items: itms,
        })
      }
    }
  }

  // !
  const rmItem = (id2, rl) => {
    const citms = [...itms].filter(function (el) {
      if (el) return el.id != rl.id
      else return false
    })
    const chg = { ...cols }
    const loc = chg[id2].items.findIndex((x) => (x ? x.id2 == rl.id2 : false))
    chg[id2].items[loc] = null

    setDoc(doc(db, 'data', id, 'cur', sun), {
      columns: {
        ...chg,
      },
      items: citms,
      serverTime: serverTimestamp(),
    }).then((snp) => {})
    setItms(citms)
    setCols(chg)
  }

  const Plan = forwardRef((props, ref) => {
    return (
      <div
        ref={ref}
        className={`mt-0 flex w-full flex-wrap items-center justify-center `}
      >
        <DragDropContext onDragEnd={(res) => dragfin(res)}>
          {Object.entries(cols).map(([k, v]) => {
            return v.title != 'problem:' ? (
              <div
                key={k}
                className={`relative flex flex-1 grow flex-col flex-wrap items-center space-x-2 text-center align-middle`}
              >
                <span className={`mt-2 inline-block text-lg font-semibold`}>
                  {v.title}
                </span>

                <Droppable
                  droppableId={k}
                  style={{
                    flexGrow: '1',
                  }}
                >
                  {(p, snp) => {
                    return (
                      <div
                        {...p.droppableProps}
                        key={v.content}
                        ref={p.innerRef}
                        style={{
                          background: snp.isDraggingOver
                            ? 'rgb(107, 156, 143, 0.2)'
                            : 'rgb(110, 160, 240, 0.2)',
                          flexGrow: '1',
                          minHeight: '200px',
                        }}
                        className={`w-44 rounded-lg p-4`}
                      >
                        {v.items.map((e, i) => {
                          return e ? (
                            <Draggable key={i} draggableId={e.id} index={i}>
                              {(p, snp) => {
                                return (
                                  <div
                                    key={e.id}
                                    {...p.draggableProps}
                                    {...p.dragHandleProps}
                                    ref={p.innerRef}
                                    style={{
                                      userSelect: 'none',
                                      backgroundColor: snp.isDragging
                                        ? 'rgb(82, 95, 191, 0.9)'
                                        : 'rgb(34, 120, 191, 1)',
                                      ...p.draggableProps.style,
                                    }}
                                    className={`my-3 min-h-[12] rounded-lg p-3 text-white`}
                                  >
                                    usaco-{e.content}
                                    <a
                                      className={`float-right`}
                                      onClick={() => rmItem(k, e)}
                                    >
                                      <HiTrash className={`h-6 w-6`} />
                                    </a>
                                  </div>
                                )
                              }}
                            </Draggable>
                          ) : (
                            <div key={i}></div>
                          )
                        })}
                        <div key={p.innerRef}>{p.placeholder}</div>
                      </div>
                    )
                  }}
                </Droppable>
              </div>
            ) : v.items.length ? (
              <div key={k} className={`hides`}>
                {prob.name != 'x' ? (
                  <div className={`px-16 md:ml-5 md:px-32`}>
                    Selected:{' '}
                    <a
                      target={'_blank'}
                      className={`underline underline-offset-2`}
                      href={prob.url}
                    >
                      {prob.name}
                    </a>
                    {prob.name !=
                    'no more problems with these filters -W- | good job!!' ? (
                      <>
                        <Tippy
                          theme={`light-border`}
                          interactive={true}
                          content={
                            <div className={`m-4`}>
                              <a
                                onClick={blacklist}
                                className={`btn btn-ghost -mb-20 rounded-lg bg-crt bg-opacity-20 p-3`}
                              >
                                <HiBadgeCheck
                                  className={`mr-2 inline h-6 w-6`}
                                />
                                {veri}
                              </a>
                            </div>
                          }
                        >
                          <button>&nbsp;✅</button>
                        </Tippy>
                      </>
                    ) : (
                      <></>
                    )}
                  </div>
                ) : (
                  <></>
                )}
                <div
                  key={k}
                  className={`items-left align-left relative my-2 ml-12 flex w-screen flex-1 grow flex-col flex-wrap px-16 text-center md:ml-5 md:px-32`}
                >
                  <Droppable
                    droppableId={k}
                    style={{
                      flexGrow: '1',
                    }}
                  >
                    {(p, snp) => {
                      return (
                        <div
                          {...p.droppableProps}
                          key={v.content}
                          ref={p.innerRef}
                          style={{
                            background: snp.isDraggingOver
                              ? 'rgb(107, 156, 143, 0.2)'
                              : 'rgb(110, 160, 240, 0.2)',
                            flexGrow: '1',
                            minHeight: '50px',
                          }}
                          className={`w-44 rounded-lg p-4`}
                        >
                          {v.items.map((e, i) => {
                            return e ? (
                              <Draggable key={i} draggableId={e.id} index={i}>
                                {(p, snp) => {
                                  return (
                                    <div
                                      key={e.id}
                                      {...p.draggableProps}
                                      {...p.dragHandleProps}
                                      ref={p.innerRef}
                                      style={{
                                        userSelect: 'none',
                                        backgroundColor: snp.isDragging
                                          ? 'rgb(82, 95, 191, 0.9)'
                                          : 'rgb(34, 120, 191, 1)',
                                        ...p.draggableProps.style,
                                      }}
                                      className={`my-3 min-h-[12] rounded-lg p-3 text-white`}
                                    >
                                      usaco-{e.content}
                                    </div>
                                  )
                                }}
                              </Draggable>
                            ) : (
                              <div key={i}></div>
                            )
                          })}
                          <div key={p.innerRef}>{p.placeholder}</div>
                        </div>
                      )
                    }}
                  </Droppable>
                  <div key={k} className={`my-4 border-t-2 border-slate-400`} />
                </div>
              </div>
            ) : (
              <div
                key={k}
                
                className={`hides my-4 w-screen border-t-2 border-slate-400`}
              >
                {prob.name == 'no more problems with these filters -W- | good job!!' ? prob.name : ''}
              </div>
            )
          })}
        </DragDropContext>
      </div>
    )
  })
  // format:
  // format(new Date(2014, 1, 11), 'MM/dd/yyyy')

  // parse:
  // parse('02/11/2014', 'MM/dd/yyyy', new Date())

  useEffect(() => {
    if (session) {
      const dt = new Date()
      setLoading(dt.getTime())
      setToday(format(dt, 'MM-dd-yyyy').toString())
      if (getDays(dt, previousSunday(dt)) >= 7) {
        setSun(format(dt, 'MM-dd-yyyy'))
      } else {
        setSun(format(previousSunday(dt), 'MM-dd-yyyy'))
      }
    }
  }, [])

  // hopefully they'll change about the same time
  useEffect(() => {
    if (sun != '') {
      getDoc(doc(db, 'data', id, 'cur', sun)).then((snap) => {
        if (!snap.exists()) {
          newWeek()
          setDoc(doc(db, 'data', id, 'cur', sun), {
            columns: {
              bsunday: {
                title: 'Sunday',
                content: 'sun',
                items: [],
              },
              cmonday: {
                title: 'Monday',
                content: 'mon',
                items: [],
              },
              dtuesday: {
                title: 'Tuesday',
                content: 'tue',
                items: [],
              },
              ewednesday: {
                title: 'Wednesday',
                content: 'wed',
                items: [],
              },
              fthursday: {
                title: 'Thursday',
                content: 'thu',
                items: [],
              },
              gfriday: {
                title: 'Friday',
                content: 'fri',
                items: [],
              },
              hsaturday: {
                title: 'Saturday',
                content: 'sat',
                items: [],
              },
              atmp: {
                title: 'problem:',
                content: 'serotonin',
                items: [],
              },
            },
            items: [],
            serverTime: serverTimestamp(),
          }).then((snp) => {
            getDoc(doc(db, 'data', id, 'cur', sun)).then((snap) => {
              const dts = snap.data()
              setItms(dts['items'])

              const srtCol = Object.fromEntries(
                Object.entries(dts['columns']).sort()
              )
              setCols({
                ...srtCol,
              })
            })
          })
        } else {
          getDoc(doc(db, 'data', id, 'cur', sun)).then((snap) => {
            const dts = snap.data()
            setItms(dts['items'])

            const srtCol = Object.fromEntries(
              Object.entries(dts['columns']).sort()
            )
            setCols({
              ...srtCol,
            })
          })
        }
      })

      const end = new Date()
      // wait at least 2 seconds
      if (end.getTime() - isLoading > 2000) {
        setLoading(-1)
      } else {
        setTimeout(() => {
          setLoading(-1)
        }, 2000 - (end.getTime() - isLoading))
      }
    }
  }, [sun])

  return (
    <>
      <Toaster />
      <input type="checkbox" id="my-modal-4" className={`modal-toggle`} />
      <label htmlFor="my-modal-4" className={`modal cursor-pointer`}>
        <label className={`modal-box relative space-y-2`}>
          <p className={`text-xl font-semibold`}>
            change topic&nbsp;
            <span className={`mt-4 font-medium`}>
              | topic:{' '}
              <span className={`underline decoration-solid underline-offset-4`}>
                {qry.tag}
              </span>
            </span>
          </p>
          {qry.tags[0].map((k, v) => {
            return (
              <a
                onClick={tagChange}
                key={k}
                className={`mx-auto block w-96 rounded-lg bg-bg bg-opacity-75 p-2 text-left duration-300 hover:scale-105`}
              >
                {k}
              </a>
            )
          })}
        </label>
      </label>
      {isLoading != -1 ? (
        <Loading />
      ) : (
        <div className={`min-h-screen bg-bg bg-opacity-30 text-txt`}>
          <div className={`py-16 px-20 md:py-20 md:px-32`}>
            <div className={`flex flex-wrap`}></div>
            <p className={`text-3xl font-bold text-txt sm:text-4xl`}>
              <a>
                <span
                  className={`bg-gradient-to-br from-crt to-crt2 bg-clip-text text-transparent`}
                >
                  week
                </span>
                lys
                <FaCalendarWeek className={`ml-2 -mt-1.5 inline h-8 w-8`} />
              </a>
            </p>

            <span className={`text-txt`}>
              practice competitive programming efficiently (with friends!), one
              week at a time.
            </span>

            {!session ? (
              <button
                onClick={() => signIn('google')}
                className={`font-md mt-6  flex w-max space-x-2 rounded-lg border-2 p-2.5 duration-300 hover:scale-105`}
              >
                <FcGoogle className={`h-6 w-6`} />{' '}
                <span>Sign in with Google</span>
              </button>
            ) : (
              <div>
                <button
                  onClick={() => signOut()}
                  className={`font-md mt-6 flex w-max  space-x-2 rounded-lg border-2 p-2.5 duration-300 hover:scale-105 lg:float-right lg:-mt-14`}
                >
                  <span>Sign Out</span>
                </button>

                <p className={`mt-3 text-txt`}>signed in as {name}</p>
                <div className={`mt-4 border-t-2 border-slate-400`}>
                  <p
                    className={`mt-6 text-xl font-semibold text-txt sm:text-2xl`}
                  >
                    Ready for a Challenge?{' '}
                    <HiOutlineLightBulb className={`-mt-1.5 inline text-3xl`} />
                  </p>
                  <div className={`space-x-4`}>
                    filter through problems &#38; select your favorite ones!
                    <br />
                    <div className={`dropdown my-3 inline-block text-center`}>
                      <p
                        className={`mb-4 font-semibold underline underline-offset-4 `}
                      >
                        division
                      </p>
                      <label
                        tabIndex={0}
                        className={`btn btn-ghost rounded-lg bg-crt bg-opacity-20 p-3`}
                      >
                        {qry.div}
                      </label>
                      <ul
                        tabIndex={0}
                        className={`dropdown-content menu rounded-box mt-3 w-52 gap-3 bg-base-100 p-2 shadow`}
                      >
                        <li
                          id={`all`}
                          className={`duration-300 hover:scale-105`}
                        >
                          <a onClick={divChange}>all</a>
                        </li>
                        <li
                          id={`bronze`}
                          className={`duration-300 hover:scale-105`}
                        >
                          <a onClick={divChange}>bronze</a>
                        </li>
                        <li
                          id={`silver`}
                          className={`duration-300 hover:scale-105`}
                        >
                          <a onClick={divChange}>silver</a>
                        </li>
                        <li
                          id={`gold`}
                          className={`duration-300 hover:scale-105`}
                        >
                          <a onClick={divChange}>gold</a>
                        </li>
                        <li
                          id={`plat`}
                          className={`duration-300 hover:scale-105`}
                        >
                          <a onClick={divChange}>plat</a>
                        </li>
                      </ul>
                    </div>
                    <div className={`mb-6 inline-block text-center`}>
                      <p
                        className={`mb-4 -ml-0.5 font-semibold underline underline-offset-4`}
                      >
                        topic
                      </p>
                      <label
                        htmlFor="my-modal-4"
                        className={`modal-button btn btn-ghost rounded-lg bg-crt bg-opacity-20 p-3`}
                      >
                        {qry.tag}
                      </label>
                    </div>
                  </div>

                  <a
                    onClick={get_problems}
                    className={`btn btn-ghost mb-4 rounded-lg bg-[#6ea0f0] bg-opacity-20 p-3`}
                  >
                    <SiStarship className={`mr-2 inline h-6 w-6`} />
                    find a problem!
                  </a>
                </div>
                <Plan ref={compref} />
                <div className={`my-4 border-t-2 border-slate-400`} />
                <ReactToPrint
                  pageStyle={pageStyle}
                  content={() => compref.current}
                >
                  <PrintContextConsumer>
                    {({ handlePrint }) => (
                      <a
                        className={`btn btn-ghost cursor-pointer rounded-lg bg-crt bg-opacity-20 p-3 text-white`}
                        onClick={handlePrint}
                      >
                        <BsPrinterFill className={`mr-2 `} /> print!
                      </a>
                    )}
                  </PrintContextConsumer>
                </ReactToPrint>

                <p className={`ml-2 mt-1 mb-3 inline-block text-2xl`}>
                  {session ? (
                    <a
                      onClick={changeCopy}
                      className={`btn btn-ghost cursor-pointer rounded-lg bg-crt bg-opacity-20 p-3 text-white`}
                    >
                      <FaShareAlt className={`mr-2`} /> {copy}
                    </a>
                  ) : (
                    <></>
                  )}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

export async function getServerSideProps(context) {
  const session = await getSession(context)
  const name = session?.user?.name?.split(' ')[0]
  const id = session?.user?.id ?? null
  const snp = id
    ? await getDoc(doc(db, 'data', id, 'blacklist', 'contents'))
    : null
  const dt = id ? (snp.exists() ? snp.data() : null) : null

  return {
    props: {
      session: session,
      name: name?.toLowerCase() ?? null,
      id: id,
      o_blist: dt ? dt['lt'] : null,
    },
  }
}
