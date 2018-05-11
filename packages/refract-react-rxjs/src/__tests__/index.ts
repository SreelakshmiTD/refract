import * as React from 'react'
import {
    withEffects,
    EffectHandler,
    EffectFactory,
    ObservableComponent
} from '../index'
import { map, mapTo, concat } from 'rxjs/operators'
import { merge } from 'rxjs'
import { shallow, mount } from 'enzyme'

describe('refract-react-rxjs', () => {
    interface Effect {
        type: string
        value?: number
    }
    interface Props {
        value: number
        setValue: (value: number) => void
    }

    const noop = (...args) => void 0

    const effectHandler: EffectHandler<Props, Effect> = props => (
        value: Effect
    ) => {
        noop(value)
    }

    const effectFactory: EffectFactory<Props, Effect> = props => component => {
        const value$ = component.observe<number>('value')
        const valueSet$ = component.observe<number>('setValue')
        const mount$ = component.mount
        const unmount$ = component.unmount

        return merge<Effect>(
            value$.pipe(
                map(value => ({
                    type: 'ValueChange',
                    value
                }))
            ),

            valueSet$.pipe(
                map(value => ({
                    type: 'ValueSet',
                    value
                }))
            ),

            mount$.pipe(
                mapTo({
                    type: 'Start'
                })
            ),

            unmount$.pipe(
                mapTo({
                    type: 'Stop'
                })
            )
        )
    }

    it('should create a HoC', () => {
        const WithEffects = withEffects<Props, Effect>(effectHandler)(
            effectFactory
        )(() => React.createElement('div'))
    })

    it('should observe component changes', () => {
        const effectValueHandler = jest.fn()
        const setValue = jest.fn()
        const WithEffects = withEffects<Props, Effect>(
            () => effectValueHandler
        )(effectFactory)(({ setValue }) =>
            React.createElement('button', {
                onClick: () => setValue(10)
            })
        )

        const component = mount(
            React.createElement(WithEffects, { value: 1, setValue })
        )

        expect(component.prop('value')).toBe(1)
        expect(effectValueHandler).toHaveBeenCalledWith({
            type: 'ValueChange',
            value: 1
        })

        expect(effectValueHandler).toHaveBeenCalledWith({
            type: 'Start'
        })

        component.setProps({ value: 2 })
        expect(effectValueHandler).toHaveBeenCalledWith({
            type: 'ValueChange',
            value: 2
        })

        component.simulate('click')

        expect(effectValueHandler).toHaveBeenCalledWith({
            type: 'ValueSet',
            value: 10
        })

        component.unmount()

        expect(effectValueHandler).toHaveBeenCalledWith({
            type: 'Stop'
        })
    })
})