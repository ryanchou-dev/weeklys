import { doc, collection, getDoc, getDocs, limit, query, orderBy } from "firebase/firestore";
import { db } from '../../fb/Firebase'
import Link from "next/link";
import { DragDropContext, Droppable, Draggable, resetServerContext } from 'react-beautiful-dnd'
import { HiTrash } from 'react-icons/hi'
function unite({weeklys, name}) {
  const logs = JSON.parse(weeklys)
  return (
    <div className={`min-h-screen bg-bg bg-opacity-30 text-txt py-16 px-20 md:py-20 md:px-32`}>
      <p className={`text-2xl font-semibold`}>{name.split(' ')[0].toLowerCase()}'s&nbsp;
      
        <span className={`underline inline-block`}>
          <Link href={`/`}>
            <a>
              <span
                className={`bg-gradient-to-br from-crt to-crt2 bg-clip-text text-transparent`}
                >
                week
              </span>
              lys
            </a>
          </Link>
        </span>&nbsp;<span className={`text-lg`}>(last 15 weeks)</span>
      </p>
      {Object.keys(logs).map((k) => (
        <div key={k} className={`mt-6 bg-crt bg-opacity-20 p-4 rounded-lg`}>
          <p className={`text-center font-semibold text-2xl mb-2`}>{k}</p>
          <div className={`mt-0 flex w-full flex-wrap items-center justify-center `}>
            <DragDropContext onDragEnd={() => {}}>
              {Object.entries(logs[k].columns).sort().map(([k, v]) => {
                return v.title != 'problem:' ? (
                  <div
                    key={k}
                    className={`space-x-2 relative flex flex-1 grow flex-col flex-wrap items-center text-center align-middle`}
                  >
                    <span className={`  inline-block text-lg font-semibold`}>
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
                            key={v.content}
                            ref={p.innerRef}
                            style={{
                              background: snp.isDraggingOver
                                ? 'rgb(107, 156, 143, 0.2)'
                                : 'rgb(110, 160, 240, 0.2)',
                              flexGrow: '1',
                              minHeight: '200px',
                            }}
                            className={`space-y-2 w-44 p-4 rounded-lg inline`}
                          >
                            {v.items.map((e, i) => {
                              return e ? (
                                <Draggable key={i} index={i}>
                                  {(p, snp) => {
                                    return (
                                      <div
                                        
                                        
                                        key={e.id}
                                        ref={p.innerRef}
                                        style={{
                                          userSelect: 'none',
                                          backgroundColor: snp.isDragging
                                            ? 'rgb(82, 95, 191, 0.9)'
                                            : 'rgb(34, 120, 191, 1)',
                                          ...p.draggableProps.style,
                                        }}
                                        className={`rounded-lg p-3 text-white`}
                                      >
                                        <a target={'_blank'} className={`p-3`} href={"http://www.usaco.org/index.php?page=viewproblem2&cpid=" + e.content}>usaco-{e.content}</a>
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
                ) : (<div key={k}></div>)
              })}
            </DragDropContext>
          </div>
          
        </div>

      ))}
    </div>
  )
}

export async function getServerSideProps({ params }) {
  const compref = collection(db, "data", params.slug, "cur")
  const name = await getDoc(doc(db, "users", params.slug))
  const q = query(compref, orderBy("serverTime", "desc"), limit(15))
  const qsnp = await getDocs(q)

  resetServerContext()

  const mp = new Map();
  qsnp.docs.map((doc) => mp.set(doc.id, {columns: doc.data().columns, items: doc.data().items}))

  const qjs = Object.fromEntries(mp);
  if (!name.data()) {
    return {
      notFound: true,
    }
  }

  return {
    props: {
      weeklys: JSON.stringify(qjs),
      name: (name.data()).name,
    },
  }
}

export default unite