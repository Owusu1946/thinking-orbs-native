# Imagining

## Meaning and trigger

Use `state="imagining"` while generating ideas or exploring possibilities. The animation begins when the state is selected and repeats until the caller changes it. It does not represent measured progress or completion.

## Motion

An eight-second loop transforms a dotted sphere into three curved particle sheets around an empty center, then returns to the sphere. Each particle keeps its identity throughout the transformation.

- Anticipate for 1.2 seconds with a subtle change in volume.
- Unfold each sheet over 1.7 seconds, staggering their starts by 0.16 seconds.
- Hold the open sculpture until 4.8 seconds while continuing its rotation.
- Fold each sheet back over two seconds, staggering their starts by 0.1 seconds.
- Rest in the sphere through the end of the loop.

Use quintic easing to settle position, velocity, and acceleration at each transition. Rotate once per loop so both geometry and shading join continuously. Bright front edges and subdued rear surfaces convey depth without blur or background particles.

## Sizes and accessibility

At 64px, render three sheets with four particle lanes. At 20px, keep only one curved strand per sheet. Preserve the central opening in both sizes. Default speed is one; the existing speed prop scales the cycle.

The default accessibility label is `Imagining…`. Reduced motion holds the open pose at 3.7 seconds. Pause, inactive-app handling, and zero-speed behavior use the existing clock. No sound, haptics, completion flash, or additional interaction is introduced.

## Acceptance

Check the unfolding and return at actual size in both themes. Particles must remain inside the canvas, the loop and stagger boundaries must not jump, and the open pose must leave a readable central gap. Verify native rendering separately from the web preview.
