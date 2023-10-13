import React from 'react'
import InlineSVG from 'react-inlinesvg'

export const NearSymbol = () => {
    return (<>
        <span data-tooltip="NEAR">
            <InlineSVG
                src="/images/near_symbol.svg"
                className="fill-current w-min mb-tooltip flex justify-center mb-tooltip tooltip-absolute currency cursor-pointer"
            />
        </span>
    </>
    )
}