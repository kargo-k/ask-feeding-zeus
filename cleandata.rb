def cleandata
    h = Hash.new
    f = File.open('dog_names.csv')
    f.map do |line|
        name = line.strip
        h[name] = ""
    end
    puts h.keys
end