## To-do

- [x] Viewbox
- [ ] Line sample density control (adaptive sample distance)
- [x] Barycentric vector mesh interpolator
- [x] Load vector mesh (PLY)
- [ ] Boundary clipping (?)
- [x] Loop detection
- [ ] Unsteady flow
- [ ] Tapering effect



## Notes

- Placing samples only on the "empty" side of the streamline

```
PlaceSeedCandidates(streamline) {
  orthoVec = new Vec2(0, 0)
  prevArcLen = 0
  t_len = 0
    
  // Loop through the points in the streamline
  for (each consecutive pair of vertices in streamline: v0, v1) {
    v0 = streamline.vertices[i-1]
    v1 = streamline.vertices[i]
    
    if (v1.partialArcLen - (prevArcLen + t_len) > candidate_spacing) {
      // Calculate percent along last segment
      lastSegLen = v1.partialArcLen - v0.partialArcLen
      t_len = candidate_spacing - v0.partialArcLen + prevArcLen + t_len
      t = t_len / lastSegLen
      
      // Calculate point using linear interpolation
      x = lerp(v0.x, v1.x, t)
      y = lerp(v0.y, v1.y, t)
    
      // Calculate orthogonal vector using  vector field
      orthoVec = field.vec_at(x, y)
      temp = orthoVec.x
      k = this.d_sep / magnitude(orthoVec)
      orthoVec.x = -orthoVec.y * k
      orthoVec.y = temp * k
    
      // Create seed points
      s1 = new Point(x + orthoVec.x, y + orthoVec.y)
      s2 = new Point(x - orthoVec.x, y - orthoVec.y)
    
      // Add the two seed points to the queue
      seed_queue.push(s1, s2)
    
      prevArcLen = v0.partialArcLen
    }
}
```
