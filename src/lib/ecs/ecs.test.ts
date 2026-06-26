import assert from 'node:assert';
import test, { suite } from 'node:test';
import { System, World } from './world';
import { throwConstructedInvalid, throwConstructorInvalid } from './util';

suite('simple ecs', () => {
    test('ecs resource', () => {
        const world = new World(
            {
                safetyChecks: true,
                resourceAllowOverwrite: true
            },
            {}
        );
        class Thing {}
        const thing = new Thing();
        world.resources.set(thing);
        assert.strictEqual(thing, world.resources.get(Thing));
        world.resources.set(new Thing());
        assert.notStrictEqual(thing, world.resources.get(Thing));
    });
    test('ecs entity', () => {
        const world = new World(
            {
                safetyChecks: true
            },
            {}
        );
        class Thing0 {}
        class Thing1 {}
        const thing0 = new Thing0();
        const thing1 = new Thing1();
        {
            const entity = world.components.add([thing0, thing1]);
            assert.strictEqual(entity.components[0], thing0);
            assert.strictEqual(entity.components[1], thing1);
        }
        {
            const entities = world.components.entities([Thing1, Thing0]);
            assert.strictEqual(entities.length, 1);
            const entity = entities[0];
            assert.strictEqual(entity.components[0], thing1);
            assert.strictEqual(entity.components[1], thing0);
        }
        {
            world.components.add([new Thing0()]);
            world.components.add([new Thing0(), new Thing1()]);
            {
                const entities = world.components.entities([Thing0]);
                assert.strictEqual(entities.length, 3);
                for (const entity of entities) {
                    assert(entity.components[0] instanceof Thing0);
                }
            }
            {
                const entities = world.components.entities([Thing0, Thing1]);
                assert.strictEqual(entities.length, 2);
                for (const entity of entities) {
                    assert(entity.components[0] instanceof Thing0);
                    assert(entity.components[1] instanceof Thing1);
                }
            }
        }
    });
    test('ecs system', () => {
        class Thing1 {}
        class Thing2 {}
        const world = new World(
            {
                safetyChecks: true
            },
            {
                render: [
                    new System([Thing1, [Thing2]], (thing1, thing2s) => {
                        assert(thing1 instanceof Thing1);
                        assert.strictEqual(thing2s.length, 1);
                        for (const thing2e of thing2s) {
                            const [thing2] = thing2e.components;
                            assert(thing2 instanceof Thing2);
                        }
                    })
                ]
            }
        );
        world.resources.set(new Thing1());
        world.components.add([new Thing2()]);
        world.runStage('render');
    });
    test('Invalid types', () => {
        assert.throws(() => throwConstructorInvalid(Number));
        assert.throws(() => throwConstructorInvalid(String));
        assert.throws(() => throwConstructorInvalid(Array));
        assert.throws(() => throwConstructorInvalid(Object));
        assert.throws(() => throwConstructorInvalid(Function));
        assert.throws(() => throwConstructedInvalid(67));
        assert.throws(() => throwConstructedInvalid(':3'));
        assert.throws(() => throwConstructedInvalid([]));
        assert.throws(() => throwConstructedInvalid({}));
        assert.throws(() => throwConstructedInvalid(() => {}));
        assert.doesNotThrow(() => throwConstructorInvalid(Uint8Array));
        assert.doesNotThrow(() => throwConstructedInvalid(new Uint8Array([1])));
    });
});
